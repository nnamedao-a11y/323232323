"""
FastAPI proxy server that starts NestJS backend and proxies all requests.
"""
import subprocess
import os
import sys
import signal
import time
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio

NESTJS_PORT = 8002  # Internal NestJS port
nestjs_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global nestjs_process
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Start NestJS on internal port
    env = {**os.environ, 'NODE_ENV': 'development', 'PORT': str(NESTJS_PORT)}
    nestjs_process = subprocess.Popen(
        ['npx', 'ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'],
        cwd=backend_dir,
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for NestJS to start
    for _ in range(30):
        try:
            async with httpx.AsyncClient() as client:
                await client.get(f'http://localhost:{NESTJS_PORT}/api/health', timeout=1)
            break
        except:
            await asyncio.sleep(1)
    
    yield
    
    if nestjs_process:
        nestjs_process.terminate()
        nestjs_process.wait()

app = FastAPI(lifespan=lifespan)

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    url = f"http://localhost:{NESTJS_PORT}/{path}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    
    body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={"error": str(e), "message": "Backend unavailable"}
        )
