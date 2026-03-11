import requests
import time

url = "http://127.0.0.1:8000/analyze-repo"
payload = {"url": "https://github.com/swastik3616/atmos-weather"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
taskId = response.json().get('task_id')
print("Task ID:", taskId)

for _ in range(10):
    time.sleep(2)
    res = requests.get(f"http://127.0.0.1:8000/analyze-status/{taskId}")
    status = res.json()
    print("Status:", status)
    if status.get("status") in ["completed", "failed"]:
        break
