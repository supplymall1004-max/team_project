/**
 * @file barcode-scanner.tsx
 * @description 바코드 스캔 컴포넌트 - html5-qrcode 라이브러리 사용
 * 
 * 주요 기능:
 * 1. 카메라를 통한 바코드 스캔
 * 2. 식품안전나라 API 연동
 * 3. 제품 정보 자동 조회
 * 4. 스캔 결과 콜백
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string, productInfo?: ProductInfo) => void;
}

export interface ProductInfo {
  name: string;
  barcode: string;
  manufacturer?: string;
  category?: string;
  shelfLifeDays?: number;
  imageUrl?: string;
}

export function BarcodeScanner({ isOpen, onClose, onScanSuccess }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "barcode-reader";

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError(null);
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        async (decodedText) => {
          console.log("바코드 스캔 성공:", decodedText);
          setScanning(true);
          await handleBarcodeScanned(decodedText);
        },
        (errorMessage) => {
          // 스캔 중 에러는 무시 (계속 스캔 시도)
        }
      );
    } catch (err) {
      console.error("카메라 초기화 실패:", err);
      setError("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("스캐너 중지 실패:", err);
      }
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fridge/lookup-barcode?barcode=${barcode}`);
      
      if (response.ok) {
        const data: ProductInfo = await response.json();
        setProductInfo(data);
        onScanSuccess(barcode, data);
        await stopScanner();
        setTimeout(() => onClose(), 1000);
      } else {
        setError("제품 정보를 찾을 수 없습니다.");
        onScanSuccess(barcode);
        await stopScanner();
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error("바코드 조회 실패:", err);
      setError("제품 정보 조회 중 오류가 발생했습니다.");
      onScanSuccess(barcode);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            바코드 스캔
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 스캔 영역 */}
          <div className="relative">
            <div 
              id={readerElementId} 
              className="rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700"
              style={{ width: "100%" }}
            />
            
            {/* 로딩 오버레이 */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
                >
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 안내 메시지 */}
          {!error && !productInfo && (
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                제품의 바코드를 카메라에 맞춰주세요
              </AlertDescription>
            </Alert>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 성공 메시지 */}
          <AnimatePresence>
            {productInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ {productInfo.name} 인식 완료!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 취소 버튼 */}
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

