
## 如何使用
# 环境
pip install requests python-dotenv

# 初始化
import os
import requests
from dotenv import load_dotenv

load_dotenv()

class CloudBaseClient:
	def __init__(self):
		self.env_id = os.getenv("CLOUDBASE_ENV_ID")
		self.access_token = os.getenv("CLOUDBASE_ACCESS_TOKEN")
		self.base_url = f"https://{self.env_id}.api.tcloudbasegateway.com"
		self.headers = {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": f"Bearer {self.access_token}"
		}

	def request(self, method, path, **kwargs):
		"""
		统一的HTTP请求方法

		Args:
			method: 请求方法 (GET, POST, PUT, PATCH, DELETE)
			path: API路径 (如 /v1/rdb/rest/table_name)
			**kwargs: 其他请求参数 (json, params, headers等)

		Returns:
			响应数据或None
		"""
		url = f"{self.base_url}{path}"
		headers = self.headers.copy()

		# 允许自定义headers
		if "headers" in kwargs:
			headers.update(kwargs.pop("headers"))

		try:
			response = requests.request(method, url, headers=headers, **kwargs)
			response.raise_for_status()

			# 如果响应为空，返回True表示成功
			if not response.content:
				return True

			return response.json()
		except requests.exceptions.RequestException as e:
			print(f"请求失败: {e}")
			return None

cloudbase = CloudBaseClient()

# 环境ID
CLOUDBASE_ENV_ID=gft-9glo4m8o2fe40ff3

# 匿名访问令牌
CLOUDBASE_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2dmdC05Z2xvNG04bzJmZTQwZmYzLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJnZnQtOWdsbzRtOG8yZmU0MGZmMyIsImV4cCI6NDA3NTMyMjI0NywiaWF0IjoxNzcxNjM5MDQ3LCJub25jZSI6IlZqcFlkM1daUU1LZ3gzMVJXVWVjM1EiLCJhdF9oYXNoIjoiVmpwWWQzV1pRTUtneDMxUldVZWMzUSIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJnZnQtOWdsbzRtOG8yZmU0MGZmMyIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.FH1h5Z7wQ7dT_EC1dSPILp4oRzp41_i1QLQyv1ZB8Ux5F7OoSEk0mT5N_0Qm1ORBkHX5RMugXMGj4H_kaVWPo8UiaEeI2QjRxWBMwjXsqJuVwUJzmfBM-ZBPLvheLfX_iZxiWwD1gXZrE7ALLCMBjfPFyrf0nKG6PN94Ak0JtBC794RnQFTt8aGN1d6yOHN2ZHlu9peDZAT-C2kkC6FqrC1tW6xKkq-4jVPtvmNuaB7J3nsqy1VTPLFfpTzO-U2ITrdBx1EcQhVfC7dHKXvUeb6TxvMSXNetj3Gojfa5aChEps5kRtOo8moI2l0H1hDU4FO1WqoBNrntIV0fyKtMBA

# 查
from cloudbase_client import cloudbase

def get_model_data(model_name, env_type="prod"):
	"""查询数据模型数据"""
	payload = {
		"pageSize": 10,
		"pageNumber": 1,
		"getCount": True
	}

	result = cloudbase.request("POST", f"/v1/model/{env_type}/{model_name}/list", json=payload)

	if result:
		records = result.get("data", {}).get("records", [])
		print("查询成功:", records)
		return records
	return []

# 使用示例
if __name__ == "__main__":
	records = get_model_data("<YOUR_TABLE_NAME>")

# 增
from cloudbase_client import cloudbase

def add_model_data(model_name, data, env_type="prod"):
	"""新增数据模型数据"""
	result = cloudbase.request("POST", f"/v1/model/{env_type}/{model_name}/create", json={"data": data})

	if result:
		doc_id = result.get("data", {}).get("id")
		print(f"新增成功! id: {doc_id}")
	return result

# 使用示例
if __name__ == "__main__":
	result = add_model_data("<YOUR_TABLE_NAME>", {"title": "示例标题"})


# 删
from cloudbase_client import cloudbase

def delete_model_data(model_name, data_id, env_type="prod"):
	"""删除数据模型数据"""
	payload = {
		"filter": {
			"where": {
				"_id": {"$eq": data_id}
			}
		}
	}

	result = cloudbase.request("POST", f"/v1/model/{env_type}/{model_name}/delete", json=payload)

	if result:
		print("删除成功!")
		return True
	return False

# 使用示例
if __name__ == "__main__":
	result = delete_model_data("<YOUR_TABLE_NAME>", "<数据id>")

# 改
from cloudbase_client import cloudbase

def update_model_data(model_name, data_id, data, env_type="prod"):
	"""更新数据模型数据"""
	payload = {
		"data": data,
		"filter": {
			"where": {
				"_id": {"$eq": data_id}
			}
		}
	}

	result = cloudbase.request("PUT", f"/v1/model/{env_type}/{model_name}/update", json=payload)

	if result:
		print("更新成功!")
		return True
	return False

# 使用示例
if __name__ == "__main__":
	result = update_model_data("<YOUR_TABLE_NAME>", "<数据id>", {"title": "新标题"})