/**
 * CloudBase数据同步模块
 * 处理用户状态的云端保存和加载
 */

const CloudSync = {
  modelName: 'gift',
  currentUserId: null,
  currentRecordId: null,

  /**
   * 初始化用户ID（基于密码哈希）
   */
  async initUser(password) {
    // 使用密码的简单哈希作为用户ID
    this.currentUserId = await this.hashString(password);
    console.log('CloudSync: 用户ID已初始化');
  },

  /**
   * 简单的字符串哈希函数
   */
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * 从CloudBase加载用户状态
   */
  async loadState() {
    if (!this.currentUserId) {
      console.error('CloudSync: 用户ID未初始化');
      return null;
    }

    try {
      console.log('CloudSync: 正在从云端加载数据...');
      const records = await CloudBase.query(this.modelName, {
        filter: {
          where: {
            user_id: { $eq: this.currentUserId }
          }
        }
      });

      if (records && records.length > 0) {
        const record = records[0];
        this.currentRecordId = record._id;
        console.log('CloudSync: 数据加载成功', record);

        return {
          openedDays: record.opened_days || {},
          usedExclusiveGifts: record.used_exclusive_gifts || [],
          emptyCount: record.empty_count || 0,
          expiredDays: record.expired_days || {},
          unlockChances: record.unlock_chances || 0
        };
      } else {
        console.log('CloudSync: 云端无数据，将创建新记录');
        return null;
      }
    } catch (error) {
      console.error('CloudSync: 加载数据失败', error);
      return null;
    }
  },

  /**
   * 保存用户状态到CloudBase
   */
  async saveState(state) {
    if (!this.currentUserId) {
      console.error('CloudSync: 用户ID未初始化');
      return false;
    }

    try {
      const data = {
        user_id: this.currentUserId,
        opened_days: state.openedDays || {},
        used_exclusive_gifts: state.usedExclusiveGifts || [],
        empty_count: state.emptyCount || 0,
        expired_days: state.expiredDays || {},
        unlock_chances: state.unlockChances || 0,
        last_updated: new Date().toISOString()
      };

      if (this.currentRecordId) {
        // 更新现有记录
        console.log('CloudSync: 正在更新云端数据...');
        await CloudBase.update(this.modelName, this.currentRecordId, data);
        console.log('CloudSync: 数据更新成功');
      } else {
        // 创建新记录
        console.log('CloudSync: 正在创建新记录...');
        this.currentRecordId = await CloudBase.create(this.modelName, data);
        console.log('CloudSync: 新记录创建成功', this.currentRecordId);
      }

      return true;
    } catch (error) {
      console.error('CloudSync: 保存数据失败', error);
      return false;
    }
  }
};
