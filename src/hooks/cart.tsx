import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // setProducts([]);
      // await AsyncStorage.removeItem('@CartMobile:cart');
      if (products.length === 0) {
        const jsonProducts = await AsyncStorage.getItem('@CartMobile:cart');
        if (jsonProducts) {
          const storageProducts = JSON.parse(jsonProducts);
          setProducts(storageProducts);
        }
      }
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      let productExists = false;

      const newProducts = products.map(prod => {
        if (prod.id === product.id) {
          productExists = true;
          return { ...prod, quantity: prod.quantity + 1 };
        }

        return prod;
      });

      if (productExists) {
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@CartMobile:cart',
          JSON.stringify(newProducts),
        );
      } else {
        const productsToSet = [...products, { ...product, quantity: 1 }];
        setProducts(productsToSet);
        await AsyncStorage.setItem(
          '@CartMobile:cart',
          JSON.stringify(productsToSet),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const index = products.findIndex(prod => prod.id === id);

      if (index !== -1) {
        const productsToSet = [
          ...products.slice(0, index),
          { ...products[index], quantity: products[index].quantity + 1 },
          ...products.slice(index + 1),
        ];

        setProducts(productsToSet);
        await AsyncStorage.setItem(
          '@CartMobile:cart',
          JSON.stringify(productsToSet),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(prod => prod.id === id);

      if (index === -1) return;

      if (products[index].quantity === 1) {
        const productsToSet = [...products.filter(prod => prod.id !== id)];
        setProducts(productsToSet);
        await AsyncStorage.setItem(
          '@CartMobile:cart',
          JSON.stringify(productsToSet),
        );
        return;
      }

      const productsToSet = [
        ...products.slice(0, index),
        { ...products[index], quantity: products[index].quantity - 1 },
        ...products.slice(index + 1),
      ];

      setProducts(productsToSet);
      await AsyncStorage.setItem(
        '@CartMobile:cart',
        JSON.stringify(productsToSet),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
