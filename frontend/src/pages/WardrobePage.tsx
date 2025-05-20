import { useState, useEffect } from 'react'
import { useToastContext } from '../contexts/ToastContext'
import { clothApi } from '../services/api'
import AddClothModal from '../components/AddClothModal'
import { AuthenticatedImage } from '../components/AuthenticatedImage'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface ClothingItem {
  id: string
  name: string
  category: string
  image: string
  description?: string
  price?: number
  size?: number
  size_metrics?: string
  material?: string
  brand?: string
  isFavorite?: boolean
  // T-shirt specific
  neckType?: string
  sleeveType?: string
  // Jeans specific
  fitType?: string
  // Skirt specific
  skirtType?: string
}

interface SharedWardrobe {
  id: number;
  ownerUsername: string;
  sharedWithUsername: string;
  isActive: boolean;
}

interface SharedWardrobeItem {
  item: ClothingItem;
  isFavorite: boolean;
}

const categories = ['all', 'tshirts', 'jeans', 'skirts']
const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'size-asc', label: 'Size (Small to Large)' },
  { value: 'size-desc', label: 'Size (Large to Small)' }
]

const preferenceFilters = [
  { value: 'all', label: 'All Items' },
  { value: 'liked', label: 'Liked Items' },
  { value: 'disliked', label: 'Disliked Items' }
]

export function WardrobePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [selectedPreference, setSelectedPreference] = useState('all')
  const [itemPreferences, setItemPreferences] = useState<Record<string, boolean>>({})
  const { toast } = useToastContext()
  const navigate = useNavigate()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareUsername, setShareUsername] = useState('')
  const [sharedWardrobes, setSharedWardrobes] = useState<SharedWardrobe[]>([])
  const [wardrobesSharedByMe, setWardrobesSharedByMe] = useState<SharedWardrobe[]>([])
  const [selectedSharedWardrobe, setSelectedSharedWardrobe] = useState<string | null>(null);
  const [sharedWardrobeItems, setSharedWardrobeItems] = useState<Record<string, SharedWardrobeItem[]>>({});
  const [likedCombinations, setLikedCombinations] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      toast({
        title: 'Authentication Required',
        description: 'Please log in to view your wardrobe',
        variant: 'destructive',
      })
      navigate('/login')
      return
    }

    // Load both outfits and shared wardrobes
    Promise.all([
      loadOutfits(),
      loadSharedWardrobes()
    ]).catch(error => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Let the interceptor handle the redirect
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to load wardrobe data',
        variant: 'destructive',
      })
    }).finally(() => {
      setIsLoading(false)
    })
  }, [toast, navigate])

  const loadOutfits = async () => {
    try {
      const data = await clothApi.getOutfits()
      // Transform the data into a flat array of clothing items
      const allItems: ClothingItem[] = []
      
      // Add t-shirts
      if (data.tshirts) {
        data.tshirts.forEach((item: any) => {
          allItems.push({
            id: item.id.toString(),
            name: `T-shirt - ${item.brand || 'Unknown Brand'}`,
            category: 'tshirts',
            image: item.imgUrl || '',
            material: item.material,
            brand: item.brand,
            size: item.size,
            size_metrics: item.size_metrics,
            neckType: item.neckType,
            sleeveType: item.sleeveType
          })
        })
      }
      
      // Add jeans
      if (data.jeans) {
        data.jeans.forEach((item: any) => {
          allItems.push({
            id: item.id.toString(),
            name: `Jeans - ${item.brand || 'Unknown Brand'}`,
            category: 'jeans',
            image: item.imgUrl || '',
            material: item.material,
            brand: item.brand,
            size: item.size,
            size_metrics: item.size_metrics,
            fitType: item.fitType
          })
        })
      }
      
      // Add skirts
      if (data.skirts) {
        data.skirts.forEach((item: any) => {
          allItems.push({
            id: item.id.toString(),
            name: `Skirt - ${item.brand || 'Unknown Brand'}`,
            category: 'skirts',
            image: item.imgUrl || '',
            material: item.material,
            brand: item.brand,
            size: item.size,
            size_metrics: item.size_metrics,
            skirtType: item.skirtType
          })
        })
      }
      
      setItems(allItems)
    } catch (error) {
      console.error('Error loading outfits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wardrobe items',
        variant: 'destructive',
      });
    }
  }

  const loadSharedWardrobes = async () => {
    try {
      const [sharedWithMe, sharedByMe] = await Promise.all([
        clothApi.getSharedWardrobes(),
        clothApi.getWardrobesSharedByMe()
      ])
      setSharedWardrobes(sharedWithMe)
      setWardrobesSharedByMe(sharedByMe)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load shared wardrobes',
        variant: 'destructive',
      })
    }
  }

  const handleLike = async (clothId: string) => {
    try {
      if (likedCombinations[clothId]) {
        await clothApi.dislikeCloth(clothId);
        setLikedCombinations(prev => ({ ...prev, [clothId]: false }));
        toast({ title: 'Unliked', description: 'Cloth unliked.' });
      } else {
        await clothApi.likeCloth(clothId);
        setLikedCombinations(prev => ({ ...prev, [clothId]: true }));
        toast({ title: 'Liked', description: 'Cloth liked!' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to like/unlike cloth',
        variant: 'destructive',
      });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSortBy('name-asc')
    setSelectedBrand('all')
    setSelectedMaterial('all')
    setSelectedSize('all')
    setSelectedPreference('all')
  }

  const handleShare = async () => {
    if (!shareUsername.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await clothApi.shareWardrobe(shareUsername)
      toast({
        title: 'Success',
        description: response,
      })
      setShareUsername('')
      setIsShareModalOpen(false)
      loadSharedWardrobes()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share wardrobe',
        variant: 'destructive',
      })
    }
  }

  const handleUnshare = async (username: string) => {
    try {
      console.log('Attempting to unshare wardrobe with username:', username);
      const response = await clothApi.unshareWardrobe(username);
      console.log('Unshare response:', response);
      toast({
        title: 'Success',
        description: response,
      });
      // Refresh the shared wardrobes list
      await loadSharedWardrobes();
    } catch (error) {
      console.error('Unshare error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unshare wardrobe',
        variant: 'destructive',
      });
    }
  };

  const loadSharedWardrobeItems = async (ownerUsername: string) => {
    try {
      const data = await clothApi.getSharedWardrobeItems(ownerUsername);
      const items: Record<string, SharedWardrobeItem[]> = {
        tshirts: [],
        jeans: [],
        skirts: []
      };

      // Transform the data into our format
      Object.entries(data).forEach(([category, itemsList]) => {
        items[category] = (itemsList as any[]).map(({ item, isFavorite }) => ({
          item: {
            id: item.id,
            name: `${category === 'tshirts' ? 'T-shirt' : category === 'jeans' ? 'Jeans' : 'Skirt'} - ${item.brand || 'Unknown Brand'}`,
            category,
            image: item.imgUrl,
            material: item.material,
            brand: item.brand,
            size: item.size,
            size_metrics: item.size_metrics,
            neckType: item.neckType,
            sleeveType: item.sleeveType,
            fitType: item.fitType,
            skirtType: item.skirtType
          },
          isFavorite: isFavorite || false
        }));
      });

      setSharedWardrobeItems(items);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load shared wardrobe items',
        variant: 'destructive',
      });
    }
  };

  const handleViewSharedWardrobe = async (ownerUsername: string) => {
    setSelectedSharedWardrobe(ownerUsername);
    await loadSharedWardrobeItems(ownerUsername);
  };

  const filteredItems = items
    .filter(item => {
      // Only show items from current user's wardrobe when not viewing a shared wardrobe
      if (!selectedSharedWardrobe) {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false
        }
        // Brand filter
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) {
          return false
        }
        // Material filter
        if (selectedMaterial !== 'all' && item.material !== selectedMaterial) {
          return false
        }
        // Size filter
        if (selectedSize !== 'all' && item.size?.toString() !== selectedSize) {
          return false
        }
        // Preference filter
        if (selectedPreference !== 'all') {
          const isLiked = itemPreferences[item.id]
          if (selectedPreference === 'liked' && !isLiked) return false
          if (selectedPreference === 'disliked' && isLiked) return false
        }
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            item.name.toLowerCase().includes(query) ||
            item.brand?.toLowerCase().includes(query) ||
            item.material?.toLowerCase().includes(query)
          )
        }
        return true
      }
      return false // Don't show personal items when viewing a shared wardrobe
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-desc':
          return b.id.localeCompare(a.id)
        case 'date-asc':
          return a.id.localeCompare(b.id)
        case 'size-asc':
          return (a.size || 0) - (b.size || 0)
        case 'size-desc':
          return (b.size || 0) - (a.size || 0)
        default:
          return 0
      }
    })

  // Get unique values for filters
  const brands = ['all', ...new Set(items.map(item => item.brand).filter(Boolean))]
  const materials = ['all', ...new Set(items.map(item => item.material).filter(Boolean))]
  const sizes = ['all', ...new Set(items.map(item => item.size?.toString()).filter(Boolean))]

  const handleAddItem = () => {
    setIsAddModalOpen(true)
  }

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // Clear all state
    setItems([]);
    setSharedWardrobes([]);
    setWardrobesSharedByMe([]);
    setSharedWardrobeItems({});
    setSelectedSharedWardrobe(null);
    setIsLoading(true);
    
    // Show success message
    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
    
    // Force navigation to login page
    window.location.href = '/login';
  };

  const handleTry = (clothId: string) => {
    console.log('Try button clicked for cloth:', clothId);
    // Add your try logic here
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Wardrobe</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Share Wardrobe
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Reset Filters
          </button>
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Item
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Shared Wardrobes Section */}
      {(sharedWardrobes.length > 0 || wardrobesSharedByMe.length > 0) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Shared Wardrobes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wardrobes shared with me */}
            {sharedWardrobes.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Shared with me</h3>
                <ul className="space-y-2">
                  {sharedWardrobes.map((share) => (
                    <li key={share.id} className="flex justify-between items-center">
                      <span>{share.ownerUsername}</span>
                      <button
                        onClick={() => handleViewSharedWardrobe(share.ownerUsername)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Wardrobe
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Wardrobes I've shared */}
            {wardrobesSharedByMe.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Shared by me</h3>
                <ul className="space-y-2">
                  {wardrobesSharedByMe.map((share) => (
                    <li key={share.id} className="flex justify-between items-center">
                      <span>{share.sharedWithUsername}</span>
                      <button
                        onClick={() => handleUnshare(share.sharedWithUsername)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Unshare
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Wardrobe View */}
      {selectedSharedWardrobe && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedSharedWardrobe}'s Wardrobe
            </h2>
            <button
              onClick={() => setSelectedSharedWardrobe(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to My Wardrobe
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(sharedWardrobeItems)
              .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
              .flatMap(([_, items]) => items)
              .map(({ item, isFavorite }) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative group">
                    <div className="relative">
                      <AuthenticatedImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => handleLike(item.id)}
                        className="absolute top-2 right-2 z-20"
                      >
                        {likedCombinations[item.id] ? (
                          // Filled heart for liked
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        ) : (
                          // Outline heart for not liked
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col items-center justify-center p-4">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-sm mb-1">Material: {item.material}</p>
                        <p className="text-sm mb-1">Brand: {item.brand}</p>
                        <p className="text-sm mb-1">Size: {item.size} {item.size_metrics}</p>
                        {item.neckType && <p className="text-sm mb-1">Neck: {item.neckType}</p>}
                        {item.sleeveType && <p className="text-sm mb-1">Sleeve: {item.sleeveType}</p>}
                        {item.fitType && <p className="text-sm mb-1">Fit: {item.fitType}</p>}
                        {item.skirtType && <p className="text-sm mb-1">Style: {item.skirtType}</p>}
                        <button
                          onClick={() => handleTry(item.id)}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Try
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-gray-600 capitalize">{item.category}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, brand, or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Category Filter - Only show in personal wardrobe view */}
          {!selectedSharedWardrobe && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand === 'all' ? 'All Brands' : brand}
                </option>
              ))}
            </select>
          </div>

          {/* Material Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {materials.map((material) => (
                <option key={material} value={material}>
                  {material === 'all' ? 'All Materials' : material}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size === 'all' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>

          {/* Preference Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
            <select
              value={selectedPreference}
              onChange={(e) => setSelectedPreference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {preferenceFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Showing {filteredItems.length} of {items.length} items
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative group">
              <div className="relative">
                <AuthenticatedImage
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => handleLike(item.id)}
                  className="absolute top-2 right-2 z-20"
                >
                  {likedCombinations[item.id] ? (
                    // Filled heart for liked
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    // Outline heart for not liked
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col items-center justify-center p-4">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-sm mb-1">Material: {item.material}</p>
                  <p className="text-sm mb-1">Brand: {item.brand}</p>
                  <p className="text-sm mb-1">Size: {item.size} {item.size_metrics}</p>
                  {item.neckType && <p className="text-sm mb-1">Neck: {item.neckType}</p>}
                  {item.sleeveType && <p className="text-sm mb-1">Sleeve: {item.sleeveType}</p>}
                  {item.fitType && <p className="text-sm mb-1">Fit: {item.fitType}</p>}
                  {item.skirtType && <p className="text-sm mb-1">Style: {item.skirtType}</p>}
                  <button
                    onClick={() => handleTry(item.id)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600 capitalize">{item.category}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Share Wardrobe</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username to share with
              </label>
              <input
                type="text"
                value={shareUsername}
                onChange={(e) => setShareUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      <AddClothModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadOutfits}
      />
    </div>
  )
} 