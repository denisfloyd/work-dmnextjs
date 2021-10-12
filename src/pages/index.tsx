import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

import Prismic from "@prismicio/client";
import { RichText } from "prismic-dom";

import { getPrismicClient } from "@/services/prismic";

import commonStyles from "@/styles/common.module.scss";
import styles from "./home.module.scss";

interface Product {
  uid?: string;
  title: string;
  price: number;
  price_formatted: string;
}

interface HomeProps {
  next_page: string;
  productsFromServer: Product[];
}

export default function Home({ next_page, productsFromServer }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextPage, setNextPage] = useState("");

  useEffect(() => {
    setProducts(productsFromServer);
    setNextPage(next_page);
  }, [productsFromServer, next_page]);

  function handlePagination(): void {
    fetch(
      `${nextPage}&access_token=${process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN}`
    )
      .then((res) => res.json())
      .then((data) => {
        const newProductsFromPagination = data.results.map((product) => {
          return {
            uid: product.uid,
            title: RichText.asText(product.data.title),
            price: product.data.price,
            price_formatted: Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(product.data.price),
          };
        });

        setProducts([...products, ...newProductsFromPagination]);

        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main className={`${commonStyles.container}`}>
        <section className={`${styles.product}`}>
          {products &&
            products.length > 0 &&
            products.map((product) => (
              <Link key={product.uid} href={`/product/${product.uid}`}>
                <a>
                  <h1>{product.title}</h1>
                  <p>{product.price_formatted}</p>
                </a>
              </Link>
            ))}
        </section>

        {nextPage && (
          <button
            className={styles.moreposts}
            type="button"
            onClick={handlePagination}
          >
            Carregar mais..
          </button>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prismic = getPrismicClient();

  const productResponse = await prismic.query(
    [Prismic.predicates.at("document.type", "product")],
    {
      fetch: ["product.title", "product.price"],
      pageSize: 2,
    }
  );

  const products = productResponse.results.map((product) => {
    return {
      uid: product.uid,
      title: RichText.asText(product.data.title),
      price: product.data.price,
      price_formatted: Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(product.data.price),
    };
  });

  return {
    props: {
      productsFromServer: products,
      next_page: productResponse.next_page,
    },
  };
};
