import asyncio
import time
import statistics
from fastapi.testclient import TestClient
from app.main import app

def run_stress_test(total_requests=500, max_workers=20):
    client = TestClient(app)
    latencies = []
    status_codes = {}
    
    print(f"==================================================")
    print(f" Starting Stress Test")
    print(f" Target: Local FastAPI Application Scope")
    print(f" Total Requests: {total_requests}")
    print(f" Workers: {max_workers}")
    print(f"==================================================")

    start_time = time.perf_counter()

    for i in range(total_requests):
        req_start = time.perf_counter()
        
        # Alternate between valid public routes and rate-limited auth endpoints
        if i % 4 == 0:
            res = client.get("/")
        elif i % 4 == 1:
            res = client.post("/login", data={"username": f"user{i}@test.com", "password": "wrongpassword"})
        elif i % 4 == 2:
            res = client.get("/public/support-contact")
        else:
            res = client.get("/public/posts")
            
        req_end = time.perf_counter()
        duration_ms = (req_end - req_start) * 1000
        latencies.append(duration_ms)
        
        code = res.status_code
        status_codes[code] = status_codes.get(code, 0) + 1

    end_time = time.perf_counter()
    total_duration_sec = end_time - start_time
    rps = total_requests / total_duration_sec

    latencies.sort()
    avg_latency = statistics.mean(latencies)
    p50_latency = statistics.median(latencies)
    p95_index = int(0.95 * len(latencies))
    p95_latency = latencies[p95_index] if latencies else 0
    p99_index = int(0.99 * len(latencies))
    p99_latency = latencies[p99_index] if latencies else 0

    print("\n--- Stress Test Results ---")
    print(f"Total Duration      : {total_duration_sec:.2f} s")
    print(f"Throughput          : {rps:.2f} req/sec")
    print(f"Average Latency     : {avg_latency:.2f} ms")
    print(f"P50 Median Latency  : {p50_latency:.2f} ms")
    print(f"P95 Latency         : {p95_latency:.2f} ms")
    print(f"P99 Latency         : {p99_latency:.2f} ms")
    print(f"Min Latency         : {min(latencies):.2f} ms")
    print(f"Max Latency         : {max(latencies):.2f} ms")
    print("\n--- Status Code Breakdown ---")
    for code, count in sorted(status_codes.items()):
        status_name = "OK" if code == 200 else ("Rate Limited" if code == 429 else f"HTTP {code}")
        print(f"  HTTP {code} ({status_name}): {count} requests ({count/total_requests*100:.1f}%)")
    print("==================================================\n")

if __name__ == "__main__":
    run_stress_test(total_requests=1000, max_workers=20)
