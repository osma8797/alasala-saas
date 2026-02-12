'use client';

import Link from 'next/link';

interface FooterProps {
  basePath?: string;
}

export function Footer({ basePath = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">Al Asala Restaurant</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Experience authentic Middle Eastern cuisine with our signature dishes,
              grilled meats, and traditional recipes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`${basePath}/menu`} className="hover:text-white transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/about`} className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/cart`} className="hover:text-white transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Prince Turki Street</li>
              <li>Al Khobar, Saudi Arabia</li>
              <li>+966 53 063 8477</li>
              <li>info@alasala.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Al Asala Restaurant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
