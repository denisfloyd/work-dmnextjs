import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { getPrismicClient } from "@/services/prismic";
import { RichText } from "prismic-dom";

import commonStyles from "@/styles/common.module.scss";
import styles from "./product.module.scss";

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
  const router = useRouter();

  if (router.isFallback) {
    return <div className={`${styles.fallback}`}>Carregando produtos...</div>;
  }

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
          </aside>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
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
  };
};
