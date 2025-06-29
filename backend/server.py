from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Ledger Recovery API is running"}

@app.get("/api/auth/me")
async def auth_me():
    return {"message": "Not authenticated"}

@app.post("/api/client/login")
async def client_login():
    return {"user": {"id": 1, "email": "client@demo.com", "onboardingCompleted": True, "kycCompleted": True}}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
