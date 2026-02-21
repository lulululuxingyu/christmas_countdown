"""
CloudBase CRUD操作测试
测试增删查改功能
"""
from cloudbase_client import cloudbase

# 测试用的数据模型名称
TEST_MODEL = "gift"

def test_create():
    """测试创建数据"""
    print("\n=== 测试创建数据 ===")
    test_data = {
        "user_id": "test_user_001",
        "date": "2026-02-21",
        "gift_name": "测试礼物",
        "is_opened": False
    }

    result = cloudbase.request(
        "POST",
        f"/v1/model/prod/{TEST_MODEL}/create",
        json={"data": test_data}
    )

    if result:
        doc_id = result.get("data", {}).get("id")
        print(f"✅ 创建成功! ID: {doc_id}")
        return doc_id
    else:
        print("❌ 创建失败")
        return None

def test_query():
    """测试查询数据"""
    print("\n=== 测试查询数据 ===")
    payload = {
        "pageSize": 10,
        "pageNumber": 1,
        "getCount": True
    }

    result = cloudbase.request(
        "POST",
        f"/v1/model/prod/{TEST_MODEL}/list",
        json=payload
    )

    if result:
        records = result.get("data", {}).get("records", [])
        total = result.get("data", {}).get("total", 0)
        print(f"✅ 查询成功! 共 {total} 条记录")
        for record in records:
            print(f"  - ID: {record.get('_id')}, 用户: {record.get('user_id')}, 礼物: {record.get('gift_name')}")
        return records
    else:
        print("❌ 查询失败")
        return []

def test_update(data_id):
    """测试更新数据"""
    print(f"\n=== 测试更新数据 (ID: {data_id}) ===")
    payload = {
        "data": {
            "gift_name": "更新后的礼物",
            "is_opened": True
        },
        "filter": {
            "where": {
                "_id": {"$eq": data_id}
            }
        }
    }

    result = cloudbase.request(
        "PUT",
        f"/v1/model/prod/{TEST_MODEL}/update",
        json=payload
    )

    if result:
        print("✅ 更新成功!")
        return True
    else:
        print("❌ 更新失败")
        return False

def test_delete(data_id):
    """测试删除数据"""
    print(f"\n=== 测试删除数据 (ID: {data_id}) ===")
    payload = {
        "filter": {
            "where": {
                "_id": {"$eq": data_id}
            }
        }
    }

    result = cloudbase.request(
        "POST",
        f"/v1/model/prod/{TEST_MODEL}/delete",
        json=payload
    )

    if result:
        print("✅ 删除成功!")
        return True
    else:
        print("❌ 删除失败")
        return False

def run_all_tests():
    """运行所有测试"""
    print("=" * 50)
    print("开始CloudBase CRUD测试")
    print("=" * 50)

    # 1. 测试创建
    doc_id = test_create()
    if not doc_id:
        print("\n❌ 创建测试失败，终止后续测试")
        return

    # 2. 测试查询
    records = test_query()

    # 3. 测试更新
    test_update(doc_id)

    # 4. 再次查询验证更新
    print("\n=== 验证更新结果 ===")
    test_query()

    # 5. 测试删除
    test_delete(doc_id)

    # 6. 最后查询验证删除
    print("\n=== 验证删除结果 ===")
    test_query()

    print("\n" + "=" * 50)
    print("测试完成!")
    print("=" * 50)

if __name__ == "__main__":
    run_all_tests()
