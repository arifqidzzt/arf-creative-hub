import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import { Smartphone, Gamepad2, Bot, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Products = () => {
  const categories = [
    {
      id: "pulsa",
      title: "Pulsa & Kuota",
      icon: Smartphone,
      description: "Top-up pulsa dan paket data semua operator",
      products: [
        { name: "Pulsa Telkomsel 10K", price: 11000, operator: "Telkomsel" },
        { name: "Pulsa XL 25K", price: 26000, operator: "XL" },
        { name: "Kuota Indosat 3GB", price: 15000, operator: "Indosat" },
      ]
    },
    {
      id: "games",
      title: "Top-Up Game",
      icon: Gamepad2,
      description: "Diamond, UC, dan currency game populer",
      products: [
        { name: "Mobile Legends 275 Diamond", price: 75000, game: "ML" },
        { name: "PUBG Mobile 325 UC", price: 85000, game: "PUBG" },
        { name: "Free Fire 70 Diamond", price: 12000, game: "FF" },
      ]
    },
    {
      id: "bots",
      title: "Bot Premium",
      icon: Bot,
      description: "Bot automation dengan lisensi lengkap",
      products: [
        { name: "WhatsApp Bot Premium", price: 150000, duration: "1 Bulan" },
        { name: "Telegram Bot Business", price: 250000, duration: "1 Bulan" },
        { name: "Social Media Bot", price: 300000, duration: "1 Bulan" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Produk Kami
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Temukan berbagai produk digital dengan harga terbaik
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => (
            <motion.section
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <category.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.products.map((product, productIndex) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (categoryIndex * 0.2) + (productIndex * 0.1) }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-300 group">
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>
                          {'operator' in product && `Operator: ${product.operator}`}
                          {'game' in product && `Game: ${product.game}`}
                          {'duration' in product && `Durasi: ${product.duration}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 group-hover:scale-105 transition-transform"
                        >
                          Beli Sekarang
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;