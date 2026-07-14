import { useRef, useCallback } from "react";

export function useDragScroll() {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const didDrag = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Chỉ kích hoạt ở chuột, tránh touch vì touch có native scroll
    if (e.pointerType !== "mouse") return;
    
    const el = e.currentTarget;
    // Chỉ kéo được nếu nội dung thực sự dài hơn khung
    if (el.scrollWidth <= el.clientWidth) return;

    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    
    // Bắt dính sự kiện vào element này để kéo mượt cả khi chuột lướt ra ngoài
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || e.pointerType !== "mouse") return;

    const el = e.currentTarget;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX.current;

    // Kéo trên 5px mới tính là drag (tránh vô tình click hoặc bôi đen)
    if (Math.abs(walk) > 5) {
      didDrag.current = true;
      el.scrollLeft = scrollLeft.current - walk;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Nếu vừa kéo xong, hủy click vào ô con để không lỡ bấm nhầm
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false; // reset cho lần click thật sau đó
    }
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    
    // Nếu người dùng cuộn dọc nhiều hơn ngang (lăn chuột)
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      // Không preventDefault() để trang web không bị kẹt khi cuộn tới mép
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
    onWheel,
    className: "cursor-grab active:cursor-grabbing",
  };
}
