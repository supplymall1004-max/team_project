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
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "barcode-reader";

  // 카메라 권한 상태 확인
  const checkCameraPermission = async () => {
    try {
      if (!("permissions" in navigator) || typeof navigator.permissions.query !== "function") {
        // Permissions API를 지원하지 않는 브라우저
        setCameraPermission("unknown");
        return;
      }

      const status = await navigator.permissions.query({ name: "camera" as PermissionName });
      setCameraPermission(status.state as "granted" | "denied" | "prompt");
    } catch (err) {
      console.warn("[BarcodeScanner] 카메라 권한 확인 실패:", err);
      setCameraPermission("unknown");
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // 카메라 권한이 허용되었거나 prompt 상태일 때 스캐너 초기화 시도
  useEffect(() => {
    if (isOpen && (cameraPermission === "granted" || cameraPermission === "prompt" || cameraPermission === "unknown") && !scannerRef.current) {
      initializeScanner();
    }
  }, [isOpen, cameraPermission]);

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
      
      // 성공적으로 시작되면 권한 상태 업데이트
      setCameraPermission("granted");
    } catch (err: any) {
      console.error("카메라 초기화 실패:", err);
      
      // 권한 관련 에러인지 확인
      const errorMessage = err?.message || err?.toString() || "";
      const isPermissionError = 
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Permission denied") ||
        errorMessage.includes("권한") ||
        errorMessage.includes("NotReadableError") ||
        errorMessage.includes("NotFoundError");

      if (isPermissionError) {
        setCameraPermission("denied");
        setError("카메라 권한이 필요합니다. 아래 버튼을 눌러 카메라 권한을 허용해주세요.");
      } else {
        setError("카메라를 시작할 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.");
      }
    }
  };

  // 카메라 권한 요청
  const requestCameraPermission = async () => {
    setRequestingPermission(true);
    setError(null);

    try {
      // 카메라 스트림을 요청하여 권한 다이얼로그 표시
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // 권한이 허용되면 스트림 종료하고 스캐너 초기화
      stream.getTracks().forEach(track => track.stop());
      
      // 권한 상태 업데이트
      await checkCameraPermission();
      
      // 스캐너 초기화
      await initializeScanner();
    } catch (err: any) {
      console.error("카메라 권한 요청 실패:", err);
      
      const errorMessage = err?.message || err?.toString() || "";
      if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission denied")) {
        setCameraPermission("denied");
        setError("카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.");
      } else {
        setError("카메라 권한 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setRequestingPermission(false);
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
        // 제품 정보와 함께 바코드 전달
        onScanSuccess(barcode, data);
        await stopScanner();
        setTimeout(() => onClose(), 1000);
      } else {
        // 제품 정보를 찾지 못한 경우에도 최소한 바코드 정보는 전달
        const fallbackData: ProductInfo = {
          name: `바코드: ${barcode}`,
          barcode: barcode,
          shelfLifeDays: 7,
        };
        setProductInfo(fallbackData);
        setError("제품 정보를 찾을 수 없습니다. 수동으로 입력해주세요.");
        onScanSuccess(barcode, fallbackData);
        await stopScanner();
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error("바코드 조회 실패:", err);
      // 에러 발생 시에도 최소한 바코드 정보는 전달
      const fallbackData: ProductInfo = {
        name: `바코드: ${barcode}`,
        barcode: barcode,
        shelfLifeDays: 7,
      };
      setProductInfo(fallbackData);
      setError("제품 정보 조회 중 오류가 발생했습니다. 수동으로 입력해주세요.");
      onScanSuccess(barcode, fallbackData);
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

          {/* 카메라 권한 요청 안내 */}
          {cameraPermission === "denied" && !error && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <Camera className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                카메라 권한이 필요합니다. 바코드 스캔을 사용하려면 카메라 권한을 허용해주세요.
              </AlertDescription>
            </Alert>
          )}

          {/* 카메라 권한 요청 버튼 */}
          {cameraPermission === "denied" && (
            <Button
              onClick={requestCameraPermission}
              disabled={requestingPermission}
              className="w-full"
              variant="default"
            >
              {requestingPermission ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  권한 요청 중...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  카메라 권한 허용하기
                </>
              )}
            </Button>
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

