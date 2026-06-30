import React, { createContext, useState, useContext, useCallback } from 'react';

const CartContext = createContext(null);

// ---- Decimal helpers (2 decimal places) ----
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const TAX_RATE = 0.15;

// ---- Global recalculation ----
const recalcGlobal = (cartItems) => {
  let globalSubTotal = 0;
  let taxableAmount = 0;
  let taxAmount = 0;
  let totalDiscount = 0;

  for (const item of cartItems) {
    globalSubTotal = round2(globalSubTotal + item.subTotal);
    totalDiscount = round2(totalDiscount + (item.discount || 0));

    if (item.isTaxed) {
      const afterDiscount = round2(item.subTotal - (item.discount || 0));
      taxableAmount = round2(taxableAmount + afterDiscount);
    }
  }

  taxAmount = round2(taxableAmount * TAX_RATE);

  const grandTotal = round2(globalSubTotal - totalDiscount + taxAmount);

  return { globalSubTotal, taxableAmount, taxAmount, totalDiscount, grandTotal };
};

// ---- Compute row totals for a single item ----
const calcRow = (item) => {
  const subTotal = round2(item.weight * item.currentPricePerGram);
  const discount = round2(item.discount || 0);
  const afterDiscount = round2(subTotal - discount);
  const tax = item.isTaxed ? round2(afterDiscount * TAX_RATE) : 0;
  const finalTotal = round2(afterDiscount + tax);
  return { ...item, subTotal, discount, finalTotal };
};

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [paidAmount, setPaidAmountState] = useState(0);
  const [summary, setSummary] = useState({
    globalSubTotal: 0,
    taxableAmount: 0,
    taxAmount: 0,
    totalDiscount: 0,
    grandTotal: 0,
  });

  // ---- Recompute everything from scratch ----
  const refreshGlobal = useCallback((items) => {
    const newSummary = recalcGlobal(items);
    setSummary(newSummary);
    return newSummary;
  }, []);

  // ---- Payment status ----
  const getPaymentStatus = useCallback(
    (paid, grandTotal) => {
      if (paid >= grandTotal) return 'Full';
      if (paid > 0) return 'Partial';
      return 'Unpaid';
    },
    []
  );

  const remainingBalance = round2(summary.grandTotal - paidAmount);

  // ============ ACTIONS ============

  const addItem = useCallback(
    (item) => {
      setCartItems((prev) => {
        const newItem = calcRow({
          ...item,
          id: item.id || Date.now(),
          discount: item.discount || 0,
          isTaxed: item.isTaxed !== undefined ? item.isTaxed : true,
        });
        const next = [...prev, newItem];
        refreshGlobal(next);
        return next;
      });
    },
    [refreshGlobal]
  );

  const removeItem = useCallback(
    (id) => {
      setCartItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        refreshGlobal(next);
        return next;
      });
    },
    [refreshGlobal]
  );

  const toggleTax = useCallback(
    (id) => {
      setCartItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          const toggled = { ...item, isTaxed: !item.isTaxed };
          return calcRow(toggled);
        });
        refreshGlobal(next);
        return next;
      });
    },
    [refreshGlobal]
  );

  const updateDiscount = useCallback(
    (id, discountAmount) => {
      setCartItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          return calcRow({ ...item, discount: round2(discountAmount) });
        });
        refreshGlobal(next);
        return next;
      });
    },
    [refreshGlobal]
  );

  const setPaidAmount = useCallback(
    (amount) => {
      setPaidAmountState(round2(amount));
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPaidAmountState(0);
    setSummary({
      globalSubTotal: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalDiscount: 0,
      grandTotal: 0,
    });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        paidAmount,
        summary,
        remainingBalance,
        paymentStatus: getPaymentStatus(paidAmount, summary.grandTotal),
        addItem,
        removeItem,
        toggleTax,
        updateDiscount,
        setPaidAmount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
