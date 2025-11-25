import Link from 'next/link'

export default function FooterLanding() {
  return (
    <footer className="bg-white border-t-4 border-black">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-4 border-black">
          {/* Brand */}
          <div className="p-8 border-r-4 border-b-4 border-black md:border-b-0">
            <div className="mb-4">
              <span className="font-impact text-2xl uppercase tracking-tighter text-black">MERCURIUM</span>
            </div>
            <p className="font-anton text-xs uppercase text-gray-600">
              AI-POWERED INVESTMENT PLATFORM
            </p>
          </div>

          {/* Product */}
          <div className="p-8 border-r-4 border-b-4 border-black md:border-b-0">
            <h3 className="font-impact text-lg uppercase tracking-tighter text-black mb-4">PRODUCT</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  FEATURES
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  PRICING
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  DASHBOARD
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="p-8 border-r-4 border-b-4 border-black md:border-b-0">
            <h3 className="font-impact text-lg uppercase tracking-tighter text-black mb-4">COMPANY</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  ABOUT
                </Link>
              </li>
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  BLOG
                </Link>
              </li>
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  CONTACT
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="p-8 border-b-4 border-black md:border-b-0">
            <h3 className="font-impact text-lg uppercase tracking-tighter text-black mb-4">LEGAL</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  PRIVACY
                </Link>
              </li>
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  TERMS
                </Link>
              </li>
              <li>
                <Link href="#" className="font-anton text-xs uppercase text-gray-600 hover:text-black transition-colors">
                  LICENSE
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-0 border-t-4 border-black bg-black text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="font-anton text-xs uppercase">
              © {new Date().getFullYear()} MERCURIUM. ALL RIGHTS RESERVED.
            </p>
            <div className="flex space-x-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-impact text-sm uppercase hover:opacity-70 transition-opacity"
              >
                GITHUB
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-impact text-sm uppercase hover:opacity-70 transition-opacity"
              >
                TWITTER
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-impact text-sm uppercase hover:opacity-70 transition-opacity"
              >
                LINKEDIN
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


