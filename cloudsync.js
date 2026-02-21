/**
 * 数据同步模块 - 使用GitHub存储
 */

const CloudSync = {
  currentUserId: null,
  githubToken: null,

  async initUser(password) {
    this.currentUserId = await this.hashString(password);

    // 自动使用配置文件中的token（字符移位解码）
    const encodedToken = CONFIG.githubTokenHash;
    if (encodedToken) {
      // 解码：每个字符ASCII码-5
      this.githubToken = encodedToken.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 5)).join('');
      GitHubStorage.init(this.githubToken);
      console.log('CloudSync: GitHub token已自动加载');
    } else {
      // 如果配置文件没有token，尝试从localStorage加载
      this.githubToken = localStorage.getItem('github_token');
      if (this.githubToken) {
        GitHubStorage.init(this.githubToken);
        console.log('CloudSync: GitHub token从本地加载');
      } else {
        console.log('CloudSync: 未设置GitHub token');
      }
    }
  },

  setGitHubToken(token) {
    this.githubToken = token;
    localStorage.setItem('github_token', token);
    GitHubStorage.init(token);
    console.log('CloudSync: GitHub token已设置');
  },

  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async loadState() {
    if (!this.currentUserId) {
      console.error('CloudSync: 用户ID未初始化');
      return null;
    }

    try {
      console.log('CloudSync: 从GitHub加载数据...');
      const userState = await GitHubStorage.loadUserState(this.currentUserId);

      if (userState) {
        console.log('CloudSync: 数据加载成功');
        return {
          openedDays: userState.openedDays || {},
          usedExclusiveGifts: userState.usedExclusiveGifts || [],
          emptyCount: userState.emptyCount || 0,
          expiredDays: userState.expiredDays || {},
          unlockChances: userState.unlockChances || 0
        };
      }
      return null;
    } catch (error) {
      console.error('CloudSync: 加载失败', error);
      return null;
    }
  },

  async saveState(state) {
    if (!this.currentUserId) {
      console.error('CloudSync: 用户ID未初始化');
      return false;
    }

    if (!this.githubToken) {
      console.warn('CloudSync: 未设置GitHub token，无法保存');
      return false;
    }

    try {
      const data = {
        openedDays: state.openedDays || {},
        usedExclusiveGifts: state.usedExclusiveGifts || [],
        emptyCount: state.emptyCount || 0,
        expiredDays: state.expiredDays || {},
        unlockChances: state.unlockChances || 0
      };

      console.log('CloudSync: 保存到GitHub...');
      return await GitHubStorage.saveUserState(this.currentUserId, data);
    } catch (error) {
      console.error('CloudSync: 保存失败', error);
      return false;
    }
  }
};
