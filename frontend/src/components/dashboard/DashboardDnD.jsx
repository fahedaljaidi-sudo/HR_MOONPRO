
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, Plus } from 'lucide-react';

export const DraggableGrid = ({ items, renderItem, onReorder, onRemove, isEditMode, columns }) => {
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, position) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
        // Ghost image usually handled by browser, but we can style if needed
        e.target.classList.add('opacity-50');
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
        if (dragItem.current === null || dragOverItem.current === null) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        if (dragItem.current !== dragOverItem.current) {
            const newItems = [...items];
            const draggedItemContent = newItems[dragItem.current];
            newItems.splice(dragItem.current, 1);
            newItems.splice(dragOverItem.current, 0, draggedItemContent);
            onReorder(newItems);
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const gridClass = columns === 4
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    return (
        <div className={gridClass}>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()} // Necessary to allow dropping
                    className={`relative transition-all duration-300 ${isEditMode ? 'cursor-move ring-2 ring-dashed ring-secondary-300 rounded-xl bg-secondary-50/50 hover:bg-secondary-100' : ''}`}
                >
                    {isEditMode && (
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <div className="p-1 bg-white rounded shadow text-secondary-400">
                                <GripVertical className="w-4 h-4" />
                            </div>
                            <button
                                onClick={() => onRemove(item.id)}
                                className="p-1 bg-white rounded shadow text-red-500 hover:bg-red-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className={isEditMode ? 'pointer-events-none opacity-80' : ''}>
                        {renderItem(item.id)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const HiddenWidgetBar = ({ hiddenItems, allWidgetsInfo, onAdd }) => {
    const { t } = useTranslation();

    if (hiddenItems.length === 0) return null;

    return (
        <div className="mb-8 p-4 bg-secondary-50 border-2 border-dashed border-secondary-200 rounded-xl animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-semibold text-secondary-500 mb-3 uppercase tracking-wider">{t('dashboard.hidden_items', 'Hidden Items (Click to add)')}</h3>
            <div className="flex flex-wrap gap-3">
                {hiddenItems.map(item => {
                    const info = allWidgetsInfo.find(w => w.id === item.id);
                    if (!info) return null;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onAdd(item.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-secondary-200 rounded-lg shadow-sm hover:border-primary-500 hover:text-primary-600 transition-all text-sm font-medium text-secondary-600"
                        >
                            <Plus className="w-4 h-4" />
                            {info.icon && <info.icon className="w-4 h-4" />}
                            <span>{t(info.titleKey) || info.defaultTitle}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
