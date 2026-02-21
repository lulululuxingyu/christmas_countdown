/**
 * GitHub存储模块
 * 使用GitHub API存储和读取用户数据
 */

const GitHubStorage = {
  owner: 'lulululuxingyu',
  repo: 'christmas_countdown',
  branch: 'main',
  dataPath: 'data/user-states.json',
  token: null,

  init(token) {
    this.token = token;
  },

  async getFile(path) {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (this.token) headers['Authorization'] = `token ${this.token}`;

    try {
      const response = await fetch(url, { headers });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

      const data = await response.json();
      const content = atob(data.content.replace(/\n/g, ''));
      return { content, sha: data.sha };
    } catch (error) {
      console.error('GitHub Storage: 读取失败', error);
      throw error;
    }
  },

  async updateFile(path, content, message, sha = null) {
    if (!this.token) throw new Error('需要GitHub token');

    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));

    const body = { message, content: contentBase64, branch: this.branch };
    if (sha) body.sha = sha;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status} - ${errorData.message}`);
      }
      return await response.json();
    } catch (error) {
      console.error('GitHub Storage: 写入失败', error);
      throw error;
    }
  },

  async loadAllStates() {
    try {
      const file = await this.getFile(this.dataPath);
      if (!file) return { states: {}, sha: null };
      return { states: JSON.parse(file.content), sha: file.sha };
    } catch (error) {
      console.error('GitHub Storage: 解析失败', error);
      return { states: {}, sha: null };
    }
  },

  async saveAllStates(states, sha) {
    const content = JSON.stringify(states, null, 2);
    const message = `Update user states - ${new Date().toISOString()}`;
    return await this.updateFile(this.dataPath, content, message, sha);
  },

  async loadUserState(userId) {
    try {
      const { states } = await this.loadAllStates();
      return states[userId] || null;
    } catch (error) {
      console.error('GitHub Storage: 加载用户数据失败', error);
      return null;
    }
  },

  async saveUserState(userId, state) {
    try {
      const { states, sha } = await this.loadAllStates();
      states[userId] = { ...state, lastUpdated: new Date().toISOString() };
      await this.saveAllStates(states, sha);
      return true;
    } catch (error) {
      console.error('GitHub Storage: 保存用户数据失败', error);
      return false;
    }
  }
};
