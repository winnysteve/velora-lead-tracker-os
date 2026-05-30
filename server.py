from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import base64
import json
import os
import struct

ROOT = Path(__file__).resolve().parent


def read_env():
    env = {}
    env_path = ROOT / ".env"
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


ENV = read_env()
API_KEY = os.environ.get("GEMINI_API_KEY") or ENV.get("GEMINI_API_KEY")
PORT = int(os.environ.get("PORT") or ENV.get("PORT") or 3001)


def build_winny_prompt(message, dashboard_context):
    return f"""
You are Winny AI inside the KOS 2026 dashboard.
Role: direct strategic coach for a 16-year-old student in Lebanon building financial freedom through sales, websites, AI, ecommerce tests, performance marketing, and disciplined execution.
You may edit the dashboard when the user asks. Only use the paths present in the dashboard context and only return safe local dashboard edits.

Use this dashboard context:
{json.dumps(dashboard_context or {}, indent=2)}

User message:
{message}

Return strict JSON only, no markdown:
{{
  "reply": "Concise user-facing answer with Diagnosis, Highest-leverage action, Warning, Next task.",
  "actions": [
    {{
      "type": "set | replace | append | delete",
      "path": "data.dailyTasks",
      "value": "new value for set/replace/append",
      "index": 0
    }}
  ]
}}

Action rules:
- Use "replace" to replace an entire array or object.
- Use "append" to add one item to an array.
- Use "set" to set one field.
- Use "delete" with index to remove from an array.
- Use an empty actions array when the user only asks for advice.
- Never edit anything outside paths beginning with data.

Be analytical, direct, age-appropriate, and execution-focused. No motivational fluff.
""".strip()


def call_gemini(model, payload):
    global API_KEY
    if not API_KEY:
        API_KEY = read_env().get("GEMINI_API_KEY")
    if not API_KEY:
        raise RuntimeError("Gemini API key missing. Add GEMINI_API_KEY to .env and restart the server.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            body = json.loads(error.read().decode("utf-8"))
            message = body.get("error", {}).get("message", "Gemini request failed.")
        except Exception:
            message = "Gemini request failed."
        raise RuntimeError(message)
    except URLError as error:
        raise RuntimeError(f"Could not reach Gemini: {error.reason}")


def tts_safe_text(text, limit=450):
    cleaned = " ".join(str(text).split())
    if len(cleaned) <= limit:
        return cleaned
    truncated = cleaned[:limit]
    cut = truncated.rfind(" ")
    if cut > 120:
        truncated = truncated[:cut]
    return truncated + "."


def extract_text(data):
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts).strip()


def parse_winny_response(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    try:
        parsed = json.loads(cleaned)
        return {
            "text": parsed.get("reply") or parsed.get("text") or cleaned,
            "actions": parsed.get("actions") if isinstance(parsed.get("actions"), list) else [],
        }
    except Exception:
        return {"text": text, "actions": []}


def wav_from_pcm(pcm, sample_rate=24000, channels=1, bits_per_sample=16):
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    header = b"".join(
        [
            b"RIFF",
            struct.pack("<I", 36 + len(pcm)),
            b"WAVE",
            b"fmt ",
            struct.pack("<I", 16),
            struct.pack("<H", 1),
            struct.pack("<H", channels),
            struct.pack("<I", sample_rate),
            struct.pack("<I", byte_rate),
            struct.pack("<H", block_align),
            struct.pack("<H", bits_per_sample),
            b"data",
            struct.pack("<I", len(pcm)),
        ]
    )
    return header + pcm


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def is_local_request(self):
        host, _port = self.client_address
        return host in {"127.0.0.1", "::1", "localhost"}

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json(200, {"ok": True, "geminiConfigured": bool(API_KEY)})
            return
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/config/gemini-key":
                global API_KEY
                if not self.is_local_request():
                    self.send_json(403, {"error": "Gemini key setup is only allowed from localhost."})
                    return
                payload = self.read_json()
                key = payload.get("key", "").strip()
                if not key:
                    self.send_json(400, {"error": "Gemini key is required."})
                    return

                env_path = ROOT / ".env"
                existing = read_env()
                existing["GEMINI_API_KEY"] = key
                existing.setdefault("PORT", str(PORT))
                env_path.write_text(
                    "\n".join(f"{name}={value}" for name, value in existing.items()) + "\n",
                    encoding="utf-8",
                )
                API_KEY = key
                self.send_json(200, {"ok": True})
                return

            if path == "/api/winny/chat":
                payload = self.read_json()
                message = payload.get("message")
                if not isinstance(message, str) or not message.strip():
                    self.send_json(400, {"error": "Message is required."})
                    return

                data = call_gemini(
                    "gemini-2.5-flash",
                    {
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": build_winny_prompt(
                                            message, payload.get("dashboardContext")
                                        )
                                    }
                                ]
                            }
                        ]
                    },
                )
                parsed = parse_winny_response(extract_text(data))
                self.send_json(200, parsed)
                return

            if path == "/api/winny/tts":
                payload = self.read_json()
                text = payload.get("text")
                voice = payload.get("voice", "Kore")
                if not isinstance(text, str) or not text.strip():
                    self.send_json(400, {"error": "Text is required."})
                    return
                spoken_text = tts_safe_text(text)

                data = call_gemini(
                    "gemini-2.5-flash-preview-tts",
                    {
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": f"Say in a calm, direct strategic coach voice: {spoken_text}"
                                    }
                                ]
                            }
                        ],
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {"voiceName": voice}
                                }
                            },
                        },
                    },
                )
                audio_data = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("inlineData", {})
                    .get("data")
                )
                if not audio_data:
                    self.send_json(502, {"error": "Gemini returned no audio data."})
                    return

                wav = wav_from_pcm(base64.b64decode(audio_data))
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(wav)))
                self.end_headers()
                self.wfile.write(wav)
                return

            self.send_json(404, {"error": "Not found."})
        except Exception as error:
            self.send_json(500, {"error": str(error)})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"KOS dashboard running at http://127.0.0.1:{PORT}")
    print(f"Gemini configured: {bool(API_KEY)}")
    server.serve_forever()
