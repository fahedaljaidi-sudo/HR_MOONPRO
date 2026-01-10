
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowUp, ArrowDown, Eye, EyeOff, Save, GripVertical } from 'lucide-react';
import { Button } from '../ui/Button';

const CustomizeDashboardModal = ({ isOpen, onClose, currentLayout, allWidgets, onSave }) => {
    const { t } = useTranslation();
    const [localLayout, setLocalLayout] = useState(currentLayout);

    if (!isOpen) return null;

    // Helper to find widget details
    const getWidgetDetails = (id) => allWidgets.find(w => w.id === id);

    const toggleVisibility = (id) => {
        setLocalLayout(prev => prev.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        ));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newLayout = [...localLayout];
        [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
        setLocalLayout(newLayout);
    };

    const moveDown = (index) => {
        if (index === localLayout.length - 1) return;
        const newLayout = [...localLayout];
        [newLayout[index + 1], newLayout[index]] = [newLayout[index], newLayout[index + 1]];
        setLocalLayout(newLayout);
    };

    const handleSave = () => {
        onSave(localLayout);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-secondary-100 bg-secondary-50">
                    <h3 className="font-semibold text-lg">{t('dashboard.customize_title', 'Customize Dashboard')}</h3>
                    <button onClick={onClose} className="text-secondary-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    <p className="text-sm text-secondary-500 mb-4">{t('dashboard.customize_desc', 'Toggle visibility and reorder items to customize your view.')}</p>

                    {localLayout.map((item, index) => {
                        const widget = getWidgetDetails(item.id);
                        if (!widget) return null;

                        return (
                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.visible ? 'border-secondary-200 bg-white' : 'border-secondary-100 bg-secondary-50 opacity-60'} transition-all`}>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveUp(index)}
                                            disabled={index === 0}
                                            className="text-secondary-400 hover:text-primary-600 disabled:opacity-30"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveDown(index)}
                                            disabled={index === localLayout.length - 1}
                                            className="text-secondary-400 hover:text-primary-600 disabled:opacity-30"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary-100 text-secondary-600 rounded">
                                            {widget.icon ? <widget.icon className="w-4 h-4" /> : <GripVertical className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-secondary-900">{t(widget.titleKey) || widget.defaultTitle}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleVisibility(item.id)}
                                    className={`p-2 rounded-full transition-colors ${item.visible ? 'text-primary-600 hover:bg-primary-50' : 'text-secondary-400 hover:bg-secondary-100'}`}
                                >
                                    {item.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-secondary-100 bg-secondary-50 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" /> {t('common.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CustomizeDashboardModal;
