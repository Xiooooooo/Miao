import { CategoryItem } from './types';

export const DEFAULT_CATEGORIES: { expense: CategoryItem[]; income: CategoryItem[] } = {
    expense: [
        { 
            icon: '🍛', 
            name: '餐饮', 
            type: 'expense',
            children: [
                { icon: '🍔', name: '快餐', type: 'expense' },
                { icon: '🍢', name: '烧烤', type: 'expense' },
                { icon: '🥘', name: '火锅', type: 'expense' },
                { icon: '🧋', name: '奶茶', type: 'expense' },
                { icon: '☕', name: '咖啡', type: 'expense' },
                { icon: '🍹', name: '饮品', type: 'expense' },
                { icon: '🍰', name: '甜品', type: 'expense' },
                { icon: '🍎', name: '水果', type: 'expense' },
                { icon: '🍿', name: '零食', type: 'expense' },
                { icon: '🥦', name: '买菜', type: 'expense' },
            ]
        },
        { icon: '🚕', name: '交通', type: 'expense', children: [{ icon: '🚇', name: '地铁', type: 'expense'}, { icon: '🚕', name: '打车', type: 'expense'}] },
        { icon: '🛍️', name: '购物', type: 'expense', children: [{ icon: '👗', name: '服饰', type: 'expense'}, { icon: '💄', name: '美妆', type: 'expense'}, { icon: '🏠', name: '日用', type: 'expense'}] },
        { icon: '🎬', name: '娱乐', type: 'expense' },
        { icon: '🏠', name: '居住', type: 'expense' },
        { icon: '💊', name: '医疗', type: 'expense' },
        { icon: '📚', name: '学习', type: 'expense' },
        { icon: '🐾', name: '宠物', type: 'expense' },
        { icon: '🧧', name: '红包', type: 'expense' },
        { icon: '🔧', name: '其他', type: 'expense' },
    ],
    income: [
        { icon: '💰', name: '工资', type: 'income' },
        { icon: '📈', name: '理财', type: 'income' },
        { icon: '🤝', name: '兼职', type: 'income' },
        { icon: '🎁', name: '礼金', type: 'income' },
        { icon: '🪙', name: '其他', type: 'income' },
    ]
};

export const EMOJI_PRESETS = [
    '☕', '🥖', '🥦', '🍻', '✈️', '🎮', '💄', '👗', '👶', '🏋️',
    '📱', '💻', '🎁', '💐', '🏥', '🐶', '🐱', '🚌', '⛽', '🅿️',
    '💸', '🏦', '🏠', '💡', '📡', '🎓', '🎨', '🎵', '📷', '🪴'
];