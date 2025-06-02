import { Link } from "wouter";
import { Github, Twitter, MessageCircleCode, Send } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white pt-16 pb-8 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-[#8A63D2] font-bold text-2xl md:text-2xl">
                FRAMI
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Bringing creative projects to life with blockchain technology.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition"
                aria-label="Telegram"
              >
                <Send size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 font-inter text-gray-600 dark:text-gray-400">
              For Creators
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/create-project"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Start a Project
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Creator Guidelines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Fees & Payments
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Blockchain Education
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Creator Resources
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 font-inter text-gray-600 dark:text-gray-400">
              For Backers
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/explore"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Discover Projects
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Wallet Setup Guide
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Trust & Safety
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Backer Protection
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 font-inter text-gray-600 dark:text-gray-400">
              About
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Our Mission
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white transition"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400">
                © {currentYear} Frami. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
              <a
                href="#"
                className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white text-sm transition"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white text-sm transition"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white text-sm transition"
              >
                Cookie Policy
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-white dark:text-gray-400 dark:hover:text-white text-sm transition"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
