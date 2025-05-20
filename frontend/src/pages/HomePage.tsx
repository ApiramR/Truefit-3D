import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
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
      </div>
    </div>
  )
} 