import Link from "next/link";
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* About Section */}
          <div className="md:col-span-2 lg:pr-8">
            <h3 className="text-xl font-bold mb-4">HIRA𓊆𓊇JEWELS</h3>
            <p className="text-slate-400 text-sm mb-4">
              HiraJewels crafts premium imitation jewellery including bracelets, necklaces, earrings, and custom-designed pieces that celebrate elegance, style, and individuality.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                <span className="font-medium">Address:</span> Anand, Gujarat, India
              </p>
              <p>
                <span className="font-medium">Phone:</span> <a
                  href="tel:+919429667745"
                  className="hover:text-primary"
                >+91 9429667745</a>
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                <Link href="mailto:studio.hirajewels@gmail.com" className="hover:text-primary">
                  studio.hirajewels@gmail.com
                </Link>
              </p>
            </div>
            <div className="flex gap-4 mt-4">
              <Link href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-primary transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-primary transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  On time
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Studio
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} HIRA𓊆𓊇JEWELS. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
