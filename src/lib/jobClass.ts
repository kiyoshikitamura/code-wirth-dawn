/**
 * 職種名（job_class）の日本語変換ユーティリティ
 * StatusModal, TavernModal, party/list API, gossip API で共通利用
 */

export const JOB_CLASS_JP: Record<string, string> = {
    Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Paladin: '聖騎士',
    Ranger: '狩人', Scout: '斥候', Archer: '弓使い', Thief: '盗賊', Rogue: '遊撃士',
    Mage: '魔法使い', Wizard: '魔術師', Sorcerer: '術師', Warlock: '呪術師',
    Cleric: '僧侶', Priest: '神官', Druid: 'ドルイド', Shaman: '呪術師',
    Bard: '吟遊詩人', Merchant: '商人', Alchemist: '錬金術師', Scholar: '学者',
    Adventurer: '冒険者', Assassin: '暗殺者', Monk: '修道士', Necromancer: '死霊術師',
    Mercenary: '傭兵', Porter: '荷運び', Animal: '動物', Guard: '衛兵',
    Hunter: '狩人', Samurai: '侍', Miko: '巫女', Ninja: '忍者',
    Dancer: '踊り子', Lancer: '槍術士', Undead: '不死者', Chef: '料理人',
    Taoist: '道士', Ghost: '幽霊', Armor: '呪いの鎧', Bandit: '山賊',
    Villager: '村人', Machine: '自律人形', Monster: '幻獣', Object: '石像',
    Tactician: '軍師', Gambler: 'イカサマ師', Soldier: '兵士', Slave: '奴隷',
    Caster: '術師', Summoner: '召喚士', 'Heroic Spirit': '英霊',
    Official: '官僚',
};

/**
 * 英語職種名を日本語に変換。マッピングにない場合はそのまま返す。
 */
export function toJpJobClass(jobClass: string): string {
    return JOB_CLASS_JP[jobClass] || jobClass;
}
