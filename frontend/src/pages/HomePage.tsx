import { Link, useLocation } from 'react-router-dom'
import { AuthenticatedImage } from '../components/AuthenticatedImage'
import { useState, useEffect } from 'react'
import { clothApi } from '../services/api'

interface ClothingItem {
  id: string
  name: string
  category: string
  image: string
  material?: string
  brand?: string
  size?: number
  size_metrics?: string
}

interface OutfitCombination {
  top: ClothingItem | null
  bottom: ClothingItem | null
}

export function HomePage() {
  const location = useLocation();
  const tryOnResult = location.state?.tryOnResult;
  const [outfit, setOutfit] = useState<OutfitCombination>({ top: null, bottom: null });
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<'male' | 'female'>('male'); // Default to male, will be updated from profile

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await clothApi.getProfile();
        setGender(profile.gender === 'female' ? 'female' : 'male');
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    const loadOutfit = async () => {
      try {
        const data = await clothApi.getOutfits();
        const tops: ClothingItem[] = [];
        const bottoms: ClothingItem[] = [];
        
        // Transform the data into separate arrays for tops and bottoms
        if (data.tshirts) {
          data.tshirts.forEach((item: any) => {
            tops.push({
              id: item.id.toString(),
              name: item.name || `T-shirt - ${item.brand || 'Unknown Brand'}`,
              category: 'tshirts',
              image: item.imgUrl || '',
              material: item.material,
              brand: item.brand,
              size: item.size,
              size_metrics: item.size_metrics
            });
          });
        }
        
        if (data.jeans) {
          data.jeans.forEach((item: any) => {
            bottoms.push({
              id: item.id.toString(),
              name: item.name || `Jeans - ${item.brand || 'Unknown Brand'}`,
              category: 'jeans',
              image: item.imgUrl || '',
              material: item.material,
              brand: item.brand,
              size: item.size,
              size_metrics: item.size_metrics
            });
          });
        }
        
        if (data.skirts) {
          data.skirts.forEach((item: any) => {
            bottoms.push({
              id: item.id.toString(),
              name: item.name || `Skirt - ${item.brand || 'Unknown Brand'}`,
              category: 'skirts',
              image: item.imgUrl || '',
              material: item.material,
              brand: item.brand,
              size: item.size,
              size_metrics: item.size_metrics
            });
          });
        }

        // Randomly select one top and one bottom
        const randomTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;
        let randomBottom = null;
        
        if (gender === 'female') {
          // For females, randomly choose between jeans and skirts
          const availableBottoms = bottoms.filter(bottom => 
            bottom.category === 'jeans' || bottom.category === 'skirts'
          );
          randomBottom = availableBottoms.length > 0 
            ? availableBottoms[Math.floor(Math.random() * availableBottoms.length)]
            : null;
        } else {
          // For males, only choose jeans
          const jeans = bottoms.filter(bottom => bottom.category === 'jeans');
          randomBottom = jeans.length > 0 
            ? jeans[Math.floor(Math.random() * jeans.length)]
            : null;
        }

        setOutfit({ top: randomTop, bottom: randomBottom });
      } catch (error) {
        console.error('Error loading outfit:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile().then(loadOutfit);
  }, []);

  return (
    <div className="relative isolate">
      {/* Outfit Suggestion in Corner */}
      {!tryOnResult && (outfit.top || outfit.bottom) && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Today's Outfit</h3>
          <div className="space-y-2">
            {outfit.top && (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 relative">
                  <AuthenticatedImage
                    src={outfit.top.image}
                    alt={outfit.top.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{outfit.top.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{outfit.top.category}</p>
                </div>
              </div>
            )}
            {outfit.bottom && (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 relative">
                  <AuthenticatedImage
                    src={outfit.bottom.image}
                    alt={outfit.bottom.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{outfit.bottom.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{outfit.bottom.category}</p>
                </div>
              </div>
            )}
            <Link
              to="/wardrobe"
              className="block text-center text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              View in Wardrobe →
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        {tryOnResult ? (
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8">
              Your Try-On Result
            </h2>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <AuthenticatedImage
                src={tryOnResult.imageUrl}
                alt={`Try-on result for ${tryOnResult.itemName}`}
                className="w-full h-auto"
              />
              <div className="p-4">
                <p className="text-lg text-gray-600">
                  Try-on result for {tryOnResult.itemName}
                </p>
              </div>
            </div>
            <Link
              to="/wardrobe"
              className="inline-block rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try Another Item
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Your Perfect Fit, Virtually
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Experience the future of online shopping with TrueFit3D. Get accurate measurements,
              try clothes virtually, and find your perfect fit every time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/wardrobe"
                className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Get started
              </Link>
              <Link
                to="/profile"
                className="text-sm font-semibold leading-6 text-foreground"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 