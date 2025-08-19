import { motion } from "framer-motion";
import { Code, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-background via-muted/30 to-background border-t shadow-lg">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ArfCODER
              </span>
            </div>
            <p className="text-muted-foreground">
              Platform terpercaya untuk kebutuhan digital Anda. Dari top-up game hingga bot premium, semua ada di sini.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Link Cepat</h3>
            <div className="space-y-2">
              <a href="#home" className="block text-muted-foreground hover:text-primary transition-colors">
                Beranda
              </a>
              <a href="#products" className="block text-muted-foreground hover:text-primary transition-colors">
                Produk
              </a>
              <a href="#stories" className="block text-muted-foreground hover:text-primary transition-colors">
                Cerpen & Komik
              </a>
              <a href="#redeem" className="block text-muted-foreground hover:text-primary transition-colors">
                Redeem Code
              </a>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Layanan</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Top-up Pulsa
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Top-up Game
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Bot Premium
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Lisensi Software
              </a>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Kontak</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@arfcoder.com</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 ArfCODER. Semua hak dilindungi.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};