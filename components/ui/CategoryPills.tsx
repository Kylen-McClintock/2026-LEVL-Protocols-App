'use client'

interface CategoryPillsProps {
  categories: string[]
  selectedCategory: string
  onSelect: (category: string) => void
}

export function CategoryPills({ categories, selectedCategory, onSelect }: CategoryPillsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar mb-6 pb-2">
      <div className="flex w-max space-x-2 p-1">
        <button
          onClick={() => onSelect('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-out border ${
            selectedCategory === 'all'
              ? 'bg-levl-accent text-white border-levl-accent shadow-sm shadow-levl-accent/20'
              : 'bg-black/40 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          All
        </button>
        {categories.map((category) => {
          // If 'all' is selected, highlight routine categories with 50% opacity
          const isRoutine = category !== 'Diagnostics & Tracking';
          const isHighlightedAsRoutine = selectedCategory === 'all' && isRoutine;
          const isSelected = selectedCategory === category;
          
          let styles = 'bg-black/40 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white';
          if (isSelected) {
            styles = 'bg-levl-accent text-white border-levl-accent shadow-sm shadow-levl-accent/20';
          } else if (isHighlightedAsRoutine) {
            styles = 'bg-levl-accent/50 text-white/90 border-levl-accent/50';
          }

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-out border ${styles}`}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}
