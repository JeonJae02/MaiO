'use client';

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export default function Footer() {
  return (
    <footer className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 lg:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-8">
          {/* Left section */}
          <div className="sm:col-span-2 md:col-span-5">
            <p className="text-sm mb-3">Contact</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-2">
              <span className="text-green-500">Maio</span> ML
            </h2>
            <p className="text-sm text-gray-700 mb-6 sm:mb-10">인공지능 전문가 양성의 첫걸음, Maio가 함께 합니다.</p>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const choice = window.confirm(
                  "문의 방법을 선택해주세요:\n\n" +
                  "• 확인 클릭 시 전화 연결\n" +
                  "• 취소 클릭 시 이메일 작성"
                );
                
                if (choice) {
                  window.location.href = "tel:010-8269-0413";
                } else {
                  window.location.href = "mailto:jhsong02@posetch.ac.kr?subject=Maio%20ML%20문의&body=안녕하세요.%0D%0AMaio%20ML에%20대해%20문의드립니다.";
                }
              }}
              className="inline-flex items-center text-white bg-green-500 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 font-medium transition-colors hover:bg-green-600 active:bg-green-700"
            >
              Let&apos;s talk
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Middle section - Navigation */}
          <div className="sm:col-span-1 md:col-span-2 mt-8 sm:mt-0">
            <p className="font-medium mb-4 text-sm">Navigation</p>
            <ul className="space-y-3 sm:space-y-4 text-sm">
              <li>
                <Link href="/" className="hover:underline underline-offset-4 inline-block py-1">
                  Maio ML 시작하기
                </Link>
              </li>
            
              <li>
                <Link 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    const choice = window.confirm(
                      "문의 방법을 선택해주세요:\n\n" +
                      "• 확인 클릭 시 전화 연결\n" +
                      "• 취소 클릭 시 이메일 작성"
                    );
                    
                    if (choice) {
                      window.location.href = "tel:010-8269-0413";
                    } else {
                      window.location.href = "mailto:jhsong02@posetch.ac.kr?subject=Maio%20ML%20문의&body=안녕하세요.%0D%0AMaio%20ML에%20대해%20문의드립니다.";
                    }
                  }}
                  className="hover:underline underline-offset-4 inline-block py-1"
                >
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* Right section - App & Company Info */}
          <div className="sm:col-span-1 md:col-span-5 text-sm mt-8 sm:mt-0">
            <div className="mb-6">
              <p className="font-medium mb-4">Download Our App</p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  onClick={e => {
                    e.preventDefault();
                    alert('아직 준비중입니다.');
                  }}
                >
                  <span>App Store</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#"
                  className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  onClick={e => {
                    e.preventDefault();
                    alert('아직 준비중입니다.');
                  }}
                >
                  <span>Google Play</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Company Information */}
            <div className="text-xs text-gray-500">
              <p className="font-medium text-sm text-gray-900 mb-3">Company Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p>업체명: Maio 머신러닝</p>
                  <p>대표자 성명: 송준하 , 전재형</p>
                  <p>사업자 번호: - </p>
                  {/* <p>통신판매업 신고번호: -</p> */}
                </div>
                <div className="space-y-1">
                  <p>사업장 소재지 주소: 서울시 강남구 역삼로 172 마루 360 5층</p>
                  <p>전화번호: 010-8269-0413</p>
                  <p>
                    이메일:{" "}
                    <a href="mailto:jhsong02@posetch.ac.kr" className="hover:underline">
                        jhsong02@posetch.ac.kr  
                    </a>
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}