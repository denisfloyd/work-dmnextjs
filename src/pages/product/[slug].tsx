import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Prismic from "@prismicio/client";
import { getPrismicClient } from "@/services/prismic";
import { RichText } from "prismic-dom";

import commonStyles from "@/styles/common.module.scss";
import styles from "./product.module.scss";
import { useState } from "react";

interface Product {
  uid?: string;
  title: string;
  description: string;
  image: {
    url: string;
  };
  price: number;
  price_formatted: string;
}

interface ProductProps {
  product: Product;
}

export default function Product({ product }: ProductProps) {
  const [showAddProductToCart, setShowAddProductToCart] = useState(false);
  const router = useRouter();

  if (router.isFallback) {
    return <div className={`${styles.fallback}`}>Carregando produto...</div>;
  }

  // dynamic import js/ts lib
  const handleCalculateCep = async () => {
    const cepCalculate = (await import("@/utils/cepCalculate")).default;
    alert(cepCalculate("88800-000"));
  };

  // dymanic component import
  const AddProductToCart = dynamic(
    () => import("@/components/ProductAddCartAlert"),
    { loading: () => <span>Carregando componente ..</span>, ssr: false }
  );

  return (
    <>
      <Head>
        <title>{product.title}</title>
      </Head>

      <main className={`${commonStyles.container}`}>
        <Link href={"/"}>
          <a className={styles.backbutton}>
            {"<-"} Voltar para a lista de produtos
          </a>
        </Link>

        <section className={styles.container}>
          {product.image.url && <img src={product.image.url} alt="banner" />}

          <aside className={styles.product}>
            <h1>{product.title}</h1>
            <span>{product.price_formatted}</span>
            <p>{product.description}</p>

            <div className={styles.buttonContainer}>
              <button onClick={handleCalculateCep}>Calcular Cep</button>
              <button onClick={() => setShowAddProductToCart(true)}>
                Adicionar ao carrinho
              </button>
            </div>
          </aside>
        </section>

        {showAddProductToCart && <AddProductToCart />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const productResponse = await prismic.query(
    [Prismic.predicates.at("document.type", "product")],
    {
      pageSize: 1,
    }
  );

  return {
    paths: [
      ...productResponse.results.map((product) => ({
        params: { slug: product.uid },
      })),
    ],
    fallback: "blocking", // true, false, or "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID("product", String(slug), {});

  const product = {
    slug,
    title: RichText.asText(response.data.title),
    description: RichText.asText(response.data.description),
    image: response.data.image,
    price: response.data.price,
    price_formatted: Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(response.data.price),
  };

  return {
    props: {
      product,
    },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
