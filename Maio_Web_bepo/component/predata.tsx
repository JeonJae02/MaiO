'use client';

import Image from 'next/image';
import React from "react";
import Link from "next/link";
import LabelInput from '../src/app/components/LabelInput';

export default function HeroSection() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      {/* Badge */}
      <div className="flex justify-center mb-6">
        <span className="inline-block px-8 py-2 rounded-full bg-green-50 text-green-500 text-sm font-medium">
          Maio ML
        </span>
      </div>

      {/* STEP 1-1 라벨 입력 카드 */}
      <section className="bg-gray-50 rounded-3xl shadow-md p-8 mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold  text-left text-sm mb-4">
          <span className="text-green-500">STEP 1-1</span> 데이터의 종류를 알려주세요
        </h2>
        <div className="w-full rounded-3xl overflow-hidden shadow-lg mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-black/10 z-10"></div>
            <Image
              src="/mainpic2.avif"
              alt="Modern wooden and brick house"
              width={1200}
              height={700}
              className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
        </div>

        <p className="text-gray-500 text-left text-sm sm:text-base mb-6">
          인공지능이 구분해야 할 데이터의 종류를 입력해주세요.
          <br />
          예시: 걷기, 달리기, 계단 오르기 등
        </p>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl bg-white shadow-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-left">라벨 입력</h2>
            <div className="bg-gray-50 p-6 rounded-xl">
              <LabelInput />
            </div>
            <p className="mt-4 text-sm text-gray-500 text-left">
              * 입력한 라벨은 인공지능이 구분할 수 있는 동작의 종류가 됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* STEP 1-2 파일 업로드 카드 */}
      <section className="bg-gray-50 rounded-3xl shadow-md p-8 mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-left mb-4">
          <span className="text-green-500">STEP 1-2</span> 수집한 데이터를 업로드 해주세요
        </h2>

        <h2 className="text-2xl sm:text-3xl font-bold text-left mb-4">
          <span className="text-gray-800"> 실시간으로 업로드 하기</span>
        </h2>
        <p className="text-gray-500 text-left text-sm sm:text-base mb-6">
          실시간으로 업로드를 하고 싶다면, 아래 버튼을 눌러 주세요!
          <br />
          수업 환경에 따라 실시간 업로드가 불가능할 수 있습니다. 자세한 사항은 선생님께 문의하세요.
        </p>

        <div className="flex justify-left">
          <button
            className="bg-gray-300 text-gray-500 px-6 py-3 rounded-full text-sm cursor-not-allowed"
            disabled
            type="button"
          >
            실시간으로 업로드 하기 (준비 중)
          </button>
        </div>

        {/* 파일 업로드 카드이나 , 프론트에서는 아싸리 matplot처리를 한 데이터를 바로 서버로 넘기는 식으로 수정함. */}

        {/* <div className="w-full mt-8">
          <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-6 text-left">파일 업로드</h2>
            <div className="bg-gradient-to-br from-gray-50 to-green-50 p-8 rounded-xl border border-gray-200">
              <div className="flex flex-col items-center space-y-4">
                <FileUpload />
                <p className="text-sm text-gray-500 mt-4">
                  * 지원되는 파일 형식: CSV, NPY
                </p>
              </div>
            </div>
          </div>
        </div> */}
      </section>

      {/* 다음 단계로 넘어가기 */}
      <div className="flex justify-center">
        <Link
          href="/important"
          className="bg-green-500 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition"
        >
          다음 단계로 넘어가기
        </Link>
      </div>
    </div>
  );
}