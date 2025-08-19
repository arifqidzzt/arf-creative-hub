import { motion } from "framer-motion";
import { Shield, Zap, Heart, Users, Clock, Award } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "100% Aman",
      description: "Transaksi terjamin aman dengan sistem keamanan berlapis"
    },
    {
      icon: Zap,
      title: "Proses Cepat", 
      description: "Pemrosesan otomatis dalam hitungan detik"
    },
    {
      icon: Heart,
      title: "Pelayanan 24/7",
      description: "Tim support siap membantu Anda kapan saja"
    },
    {
      icon: Users,
      title: "Terpercaya",
      description: "Dipercaya oleh ribuan pengguna di seluruh Indonesia"
    },
    {
      icon: Clock,
      title: "Riwayat Lengkap",
      description: "Lacak semua transaksi Anda dengan mudah"
    },
    {
      icon: Award,
      title: "Harga Terbaik",
      description: "Dapatkan harga paling kompetitif di pasaran"
    }
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mengapa Pilih ArfCoder?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dapatkan pengalaman terbaik dengan berbagai keunggulan yang kami tawarkan
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-6 rounded-xl border hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;