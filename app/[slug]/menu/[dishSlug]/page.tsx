"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MENU_ITEMS } from "@/constants/menu";

// Extended dish data with ingredients for each dish
const DISH_DATA: Record<string, { description: string; ingredients: string[] }> = {
  salad: {
    description: "A refreshing garden salad with crisp lettuce, tomatoes, cucumbers, and a zesty lemon dressing.",
    ingredients: ["Romaine Lettuce", "Cherry Tomatoes", "Cucumber", "Red Onion", "Lemon Dressing", "Fresh Mint", "Olive Oil"],
  },
  hummus: {
    description: "Eggs poached in a spiced tomato and pepper sauce, served hot with warm pita bread.",
    ingredients: ["Eggs", "Tomatoes", "Bell Peppers", "Onion", "Garlic", "Cumin", "Olive Oil"],
  },
  tabouleh: {
    description: "A refreshing Lebanese salad made with parsley and bulgur wheat, with a hint of lemon and olive oil.",
    ingredients: ["Parsley", "Bulgur Wheat", "Tomatoes", "Cucumber", "Onion", "Lemon Juice", "Olive Oil"],
  },
  babaghanoush: {
    description: "Shredded cabbage tossed with lemon, herbs, and a light dressing.",
    ingredients: ["Cabbage", "Lemon Juice", "Olive Oil", "Parsley", "Salt", "Black Pepper", "Carrot"],
  },
  jareesh: {
    description: "Crispy bulgur shells stuffed with seasoned meat and herbs.",
    ingredients: ["Bulgur", "Ground Beef", "Onion", "Pine Nuts", "Allspice", "Parsley", "Olive Oil"],
  },
  kabsa: {
    description: "A flavorful fish and rice dish cooked with aromatic spices and served with a fresh garnish.",
    ingredients: ["Fish Fillet", "Basmati Rice", "Tomatoes", "Arabic Spices", "Vegetable Oil", "Onion", "Lemon"],
  },
  biryani: {
    description: "Fragrant basmati rice layered with tender lamb, caramelized onions, and aromatic spices.",
    ingredients: ["Basmati Rice", "Lamb", "Saffron", "Cardamom", "Cinnamon", "Fried Onions", "Yogurt"],
  },
  grills: {
    description: "Premium grilled shrimp and calamari skewers served with soy dipping sauce and fresh vegetables.",
    ingredients: ["Tiger Shrimp", "Calamari Rings", "Soy Dipping Sauce", "Lemon Wedges", "Bell Peppers", "Olive Oil", "Garlic Butter"],
  },
  kebab: {
    description: "Succulent lamb skewers marinated in traditional Middle Eastern spices, grilled to perfection.",
    ingredients: ["Premium Lamb", "Onions", "Parsley", "Arabic Spices", "Olive Oil", "Sumac", "Garlic"],
  },
  pomegranate: {
    description: "Freshly squeezed pomegranate juice, rich in antioxidants and naturally sweet.",
    ingredients: ["Fresh Pomegranates", "Ice", "Optional: Mint"],
  },
  orange: {
    description: "100% natural fresh orange juice, squeezed to order for maximum freshness.",
    ingredients: ["Fresh Oranges", "Ice"],
  },
  knafeh: {
    description: "Traditional Middle Eastern cheese pastry soaked in sweet syrup, topped with crushed pistachios.",
    ingredients: ["Semolina", "Mozzarella Cheese", "Sugar Syrup", "Rose Water", "Pistachios", "Butter", "Orange Blossom Water"],
  },
};

export default function DishPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  const dishSlug = typeof params?.dishSlug === "string" ? params.dishSlug : Array.isArray(params?.dishSlug) ? params.dishSlug[0] : "";

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderedItem, setOrderedItem] = useState("");

  // Find the dish from menu items
  const dish = MENU_ITEMS.find((item) => item.slug === dishSlug);
  const dishData = DISH_DATA[dishSlug];

  // Handle dish not found
  if (!dish) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Dish Not Found</h1>
          <p className="text-gray-600 mb-6">
            The dish you&apos;re looking for doesn&apos;t exist in our menu.
          </p>
          <Link 
            href={`/${slug}/menu`} 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const addToOrder = () => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push({ name: dish.title, price: dish.price });
    localStorage.setItem("orders", JSON.stringify(orders));
    setOrderedItem(dish.title);
    setShowConfirmation(true);
    window.setTimeout(() => setShowConfirmation(false), 3000);
  };

  return (
    <div dir="ltr" lang="en">
      <nav>
        <div className="nav-container">
          <Link href={`/${slug}`} className="logo">Al Asala Restaurant</Link>
          <div className="nav-links">
            <Link href={`/${slug}#about`}>About</Link>
            <Link href={`/${slug}/menu`}>Menu</Link>
            <Link href={`/${slug}/reservations`}>Reservations</Link>
            <Link href={`/${slug}/cart`}>Cart</Link>
          </div>
        </div>
      </nav>

      <section
        className="hero-dish"
        style={{ backgroundImage: `url("${dish.img}")` }}
      >
        <h1>{dish.title}</h1>
      </section>

      <section className="dish-details">
        <p>{dishData?.description || dish.description}</p>
        <div className="price">${dish.price}</div>
        <button className="add-to-order" onClick={addToOrder}>
          Add to Order
        </button>
        
        {dishData?.ingredients && (
          <table className="ingredients-table">
            <tbody>
              <tr>
                <th>Ingredients</th>
              </tr>
              {dishData.ingredients.map((ingredient, index) => (
                <tr key={index}>
                  <td>{ingredient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Link href={`/${slug}/menu`} className="btn">
          Back to Menu
        </Link>
      </section>

      {showConfirmation && (
        <div className="order-confirmation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Added <span>{orderedItem}</span> to order!
        </div>
      )}

      <style jsx global>{`
        :root {
          --primary: #0066FF;
          --primary-hover: #0052CC;
          --bg: #F8FAFC;
          --bg-card: #FFFFFF;
          --text: #1E293B;
          --text-secondary: #475569;
          --border: #E2E8F0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Arial", sans-serif;
        }
        body {
          background-color: var(--bg);
          color: var(--text);
        }
        nav {
          background-color: var(--bg-card);
          padding: 0.8rem;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 1.3rem;
          font-weight: bold;
          color: var(--text);
          text-decoration: none;
        }
        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          margin: 0 0.8rem;
          font-size: 1rem;
          transition: color 0.3s;
        }
        .nav-links a:hover {
          color: var(--primary);
        }
        .hero-dish {
          height: 50vh;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: #FFFFFF;
          position: relative;
          margin-top: 60px;
        }
        .hero-dish::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.3) 100%);
          z-index: 1;
        }
        .hero-dish h1 {
          position: relative;
          z-index: 2;
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        .dish-details {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1rem;
          text-align: center;
        }
        .dish-details p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .dish-details .price {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 1.5rem;
        }
        .add-to-order {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          font-size: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-bottom: 1.5rem;
        }
        .add-to-order:hover {
          background-color: var(--primary-hover);
        }
        .ingredients-table {
          width: 100%;
          max-width: 350px;
          margin: 1.5rem auto;
          border-collapse: separate;
          border-spacing: 0;
          background-color: var(--bg-card);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .ingredients-table th,
        .ingredients-table td {
          padding: 0.8rem;
          font-size: 0.95rem;
        }
        .ingredients-table th {
          background-color: var(--primary);
          color: white;
          font-weight: 600;
        }
        .ingredients-table td {
          border-bottom: 1px solid var(--border);
        }
        .ingredients-table tr:last-child td {
          border-bottom: none;
        }
        .btn {
          display: inline-block;
          background-color: var(--text);
          color: white;
          padding: 0.8rem 2rem;
          font-size: 1rem;
          border-radius: 8px;
          text-decoration: none;
          transition: background-color 0.3s;
          margin-top: 1rem;
        }
        .btn:hover {
          background-color: var(--text-secondary);
        }
        .order-confirmation {
          background-color: #10B981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2000;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: fadeInOut 3s ease;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -60%); }
          10% { opacity: 1; transform: translate(-50%, -50%); }
          90% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -60%); }
        }
        @media (max-width: 768px) {
          .hero-dish h1 { font-size: 2rem; }
          .dish-details p { font-size: 1rem; }
          .dish-details .price { font-size: 1.2rem; }
          .ingredients-table { max-width: 300px; }
          .nav-links a { font-size: 0.9rem; margin: 0 0.5rem; }
          .logo { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
