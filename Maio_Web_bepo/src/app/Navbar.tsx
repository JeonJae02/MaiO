"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
export default function Header() {

  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const mobileMenu = document.getElementById("mobile-menu")
        const menuButton = document.getElementById("menu-button")
      
        if (
          isMobileMenuOpen &&
          mobileMenu &&
          !mobileMenu.contains(target) &&
          menuButton &&
          !menuButton.contains(target)
        ) {
          setIsMobileMenuOpen(false)
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isMobileMenuOpen])
  
    // Prevent scrolling when mobile menu is open
    useEffect(() => {
      if (isMobileMenuOpen) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = ""
      }
  
      return () => {
        document.body.style.overflow = ""
      }
    }, [isMobileMenuOpen])

  return (
    <header className={`${hasScrolled ? "border-b border-gray-200" : ""} fixed w-full z-50 bg-white px-3 sm:px-6`}>
      <div className="container mx-auto max-w-[1280px] px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="mr-4 sm:mr-8 cursor-pointer flex flex-col items-center">
            <p className="text-xl sm:text-2xl font-bold">
              <span className="text-green-500">MaiO</span> ML
            </p>
            <p className="text-sm text-gray-500">머신러닝 학습은 마이오</p>
          </Link>
          
        </div>
        <div className="flex items-center">
          <nav className="hidden md:flex space-x-10 px-10 font-medium">
            <Link href="/" className="">
              <p className="hover:font-semibold">마이오</p>
            </Link>
            <Link href="/" className="">
              <p className="hover:font-semibold">문의하기</p>
            </Link>
          </nav>
          <div className="hidden md:flex items-center">
            
            <Link href="/" className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md px-4 py-2 text-sm transition-colors ease-in-out cursor-pointer">
              수업 신청하기
            </Link>
          </div>

          {/* Mobile Menu Button and Download Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md px-3 py-1.5 text-sm transition-colors ease-in-out cursor-pointer"
            >
              수업 신청하기
            </Link>

            <button
              id="menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            id="mobile-menu"
            className={`fixed top-0 right-0 h-full w-[250px] sm:w-[300px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col space-y-6 text-lg font-medium mb-8">
                <Link
                  href="/"
                  className="hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  마이오 소개
                </Link>
                <Link
                  href="/"
                  className="hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  수업 문의하기
                </Link>
              </nav>
              <div className="mt-auto">
                
              </div>
            </div>
          </div>
          
        
        </div>
      </div>
    </header>
  )
}