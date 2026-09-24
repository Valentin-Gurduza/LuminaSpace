import React, { useState, useMemo } from 'react';
import {
  Search,
  Armchair,
  Sofa,
  Table,
  Layers,
  TableProperties,
  Laptop,
  LampFloor,
  LampCeiling,
  Lamp,
  LampDesk,
  Sparkles,
  Tv,
  BookOpen,
  BedDouble,
  Boxes,
  TreePine,
  Grid,
  Image as ImageIcon,
  Sparkle,
  SquareDashed,
  Plus,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { FurnitureCategory, CatalogItemDefinition } from '../types/room';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';

interface CatalogSidebarProps {
  onAddItem: (catalogId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const CATEGORIES: { id: FurnitureCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'seating', label: 'Seating' },
  { id: 'tables', label: 'Tables' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'storage', label: 'Storage' },
  { id: 'beds', label: 'Beds' },
  { id: 'plants', label: 'Plants' },
  { id: 'decor', label: 'Decor' },
];

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  onAddItem,
  isOpen,
  onToggleOpen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon mapping
  const renderItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-5 h-5" />;
      case 'Sofa':
        return <Sofa className="w-5 h-5" />;
      case 'Table':
        return <Table className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'TableProperties':
        return <TableProperties className="w-5 h-5" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5" />;
      case 'LampFloor':
        return <LampFloor className="w-5 h-5" />;
      case 'LampCeiling':
        return <LampCeiling className="w-5 h-5" />;
      case 'Lamp':
        return <Lamp className="w-5 h-5" />;
      case 'LampDesk':
        return <LampDesk className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Tv':
        return <Tv className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'BedDouble':
        return <BedDouble className="w-5 h-5" />;
      case 'Boxes':
        return <Boxes className="w-5 h-5" />;
      case 'TreePine':
        return <TreePine className="w-5 h-5" />;
      case 'Grid':
        return <Grid className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      case 'Sparkle':
        return <Sparkle className="w-5 h-5" />;
      case 'SquareDashed':
      default:
        return <SquareDashed className="w-5 h-5" />;
    }
  };

  const filteredItems = useMemo(() => {
    return FURNITURE_CATALOG.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <aside
      className={`relative z-20 flex flex-col bg-neutral-900/95 border-r border-neutral-800 backdrop-blur-md transition-all duration-300 ${
        isOpen ? 'w-80 min-w-80' : 'w-0 min-w-0 border-none'
      }`}
    >
      {/* Toggle button on side */}
      <button
        onClick={onToggleOpen}
        title={isOpen ? 'Collapse Catalog' : 'Open Furniture Catalog'}
        className="absolute -right-3.5 top-6 z-30 flex items-center justify-center w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full border border-neutral-700 shadow-lg cursor-pointer transition-colors"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase font-sans">
                Furniture & Fixtures
              </h2>
              <span className="text-xs font-mono text-neutral-400">
                {filteredItems.length} items
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search sofas, lamps, tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>

            {/* Category Segmented Scroll */}
            <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs whitespace-nowrap rounded-md font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/luminaspace-catalog-id', item.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="group relative p-3 bg-neutral-950/60 hover:bg-neutral-800/50 border border-neutral-800/80 hover:border-neutral-700 rounded-xl cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {/* Icon Thumbnail Container */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border transition-all"
                    style={{
                      backgroundColor: `${item.defaultColor}25`,
                      borderColor: `${item.defaultColor}60`,
                      color: item.isLightSource ? '#F59E0B' : '#E2E8F0',
                    }}
                  >
                    {renderItemIcon(item.iconName)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-semibold text-neutral-200 truncate group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </h3>
                      {item.isLightSource && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono shrink-0">
                          <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Emitter
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/60 text-[10px] font-mono text-neutral-400">
                      <span>
                        {item.dimensions.width.toFixed(1)} × {item.dimensions.depth.toFixed(1)} × {item.dimensions.height.toFixed(1)}m
                      </span>

                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddItem(item.id);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 rounded font-sans font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drag hint overlay on hover */}
                <div className="text-[9px] text-neutral-400 text-center mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  Drag onto 2D / 3D room to place
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs">
                No items match "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
