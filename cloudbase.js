/**
 * CloudBase客户端 - JavaScript版本
 * 用于在浏览器中与CloudBase进行数据交互
 */

const CloudBase = {
  envId: 'gft-9glo4m8o2fe40ff3',
  accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2dmdC05Z2xvNG04bzJmZTQwZmYzLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJnZnQtOWdsbzRtOG8yZmU0MGZmMyIsImV4cCI6NDA3NTMyMjI0NywiaWF0IjoxNzcxNjM5MDQ3LCJub25jZSI6IlZqcFlkM1daUU1LZ3gzMVJXVWVjM1EiLCJhdF9oYXNoIjoiVmpwWWQzV1pRTUtneDMxUldVZWMzUSIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJnZnQtOWdsbzRtOG8yZmU0MGZmMyIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.FH1h5Z7wQ7dT_EC1dSPILp4oRzp41_i1QLQyv1ZB8Ux5F7OoSEk0mT5N_0Qm1ORBkHX5RMugXMGj4H_kaVWPo8UiaEeI2QjRxWBMwjXsqJuVwUJzmfBM-ZBPLvheLfX_iZxiWwD1gXZrE7ALLCMBjfPFyrf0nKG6PN94Ak0JtBC794RnQFTt8aGN1d6yOHN2ZHlu9peDZAT-C2kkC6FqrC1tW6xKkq-4jVPtvmNuaB7J3nsqy1VTPLFfpTzO-U2ITrdBx1EcQhVfC7dHKXvUeb6TxvMSXNetj3Gojfa5aChEps5kRtOo8moI2l0H1hDU4FO1WqoBNrntIV0fyKtMBA',
  baseUrl: null,

  init() {
    this.baseUrl = `https://${this.envId}.api.tcloudbasegateway.com`;
  },

  /**
   * 统一的HTTP请求方法
   */
  async request(method, path, data = null) {
    if (!this.baseUrl) this.init();

    const url = `${this.baseUrl}${path}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`CloudBase请求失败: ${response.status}`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // 如果响应为空，返回true表示成功
      const text = await response.text();
      if (!text) return true;

      return JSON.parse(text);
    } catch (error) {
      console.error('CloudBase请求错误:', error);
      throw error;
    }
  },

  /**
   * 查询数据
   */
  async query(modelName, filter = {}, pageSize = 100) {
    const payload = {
      pageSize: pageSize,
      pageNumber: 1,
      getCount: true,
      ...filter
    };

    const result = await this.request('POST', `/v1/model/prod/${modelName}/list`, payload);
    return result?.data?.records || [];
  },

  /**
   * 创建数据
   */
  async create(modelName, data) {
    const result = await this.request('POST', `/v1/model/prod/${modelName}/create`, { data });
    return result?.data?.id;
  },

  /**
   * 更新数据
   */
  async update(modelName, dataId, data) {
    const payload = {
      data: data,
      filter: {
        where: {
          _id: { $eq: dataId }
        }
      }
    };

    await this.request('PUT', `/v1/model/prod/${modelName}/update`, payload);
    return true;
  },

  /**
   * 删除数据
   */
  async delete(modelName, dataId) {
    const payload = {
      filter: {
        where: {
          _id: { $eq: dataId }
        }
      }
    };

    await this.request('POST', `/v1/model/prod/${modelName}/delete`, payload);
    return true;
  }
};
