
# 🛡️ PassVault | Ghost Protocol v2.0

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-green.svg?style=flat-square&logo=lock)
![AI](https://img.shields.io/badge/AI-Gemini_Pro-8E75B2.svg?style=flat-square&logo=google-gemini&logoColor=white)

<p align="center">
  <strong>"Security is not a product, but a process."</strong>
</p>

[Website](https://byghost.tr/) • [GitHub](https://github.com/ByGh00st) • [Report Bug](https://github.com/ByGh00st/passvault/issues)

</div>

---

## 🌌 Project Overview

**PassVault**, modern web teknolojileri ve askeri düzeyde şifreleme standartları üzerine inşa edilmiş, yeni nesil bir şifre yöneticisidir. **Ghost Protocol** mimarisi ile tasarlanan bu uygulama, verilerinizi tarayıcıdan çıkmadan önce şifreler (Client-Side Encryption) ve sunuculara asla ham veri göndermez.

Entegre **Security AI (Gemini)** sayesinde kasanızdaki güvenlik açıklarını analiz eder, size özel tavsiyeler verir ve siber güvenlik dünyasındaki güncel tehditlere karşı sizi uyarır.

![PassVault Screenshot](https://i.hizliresim.com/s9ft1zl.png)

## 🚀 Key Features

### 🔐 Ghost Protocol Encryption
- **AES-256-GCM:** Endüstri standardı şifreleme algoritması.
- **PBKDF2 Key Derivation:** Master şifrenizden 500.000 iterasyon ile güçlü anahtarlar türetilir.
- **Zero-Knowledge Architecture:** Master şifrenizi biz dahil kimse bilmez. Verileriniz sadece sizin cihazınızda çözülebilir.
- **Field-Level Encryption:** Her bir veri alanı (Kullanıcı adı, Şifre, Notlar) benzersiz bir IV (Initialization Vector) ile ayrı ayrı şifrelenir.

### 🧠 Neural Link (Security AI)
- **Google Gemini Entegrasyonu:** Güvenlik asistanı ile doğal dilde sohbet edin.
- **Vault Analysis:** Zayıf veya tekrar eden şifreleri yapay zeka desteğiyle analiz edin.
- **Web Grounding:** Asistan, Google Search kullanarak en güncel veri sızıntılarını ve güvenlik haberlerini kontrol edebilir.

### 🎨 Modern UI/UX
- **3D Interactive Cards:** Şifrelerinizi ve kredi kartlarınızı etkileşimli 3D kartlar olarak görüntüleyin.
- **Note Reader Mode:** Güvenli notlarınızı okumak için optimize edilmiş geniş okuma modu.
- **Customization:** Arka plan, kart renkleri, neon efektleri ve bulanıklık ayarlarını kişiselleştirin.

### 🛠️ Advanced Tools
- **Panic Mode:** Tehdit altındayken giriş yapmak için sahte bir "Panik Şifresi" belirleyin. Bu şifre ile giriş yapıldığında kasa tamamen boş görünür.
- **Password Generator:** Kırılması imkansız şifreler oluşturun.
- **Import/Export:** Verilerinizi şifreli `.pv` dosyaları olarak yedekleyin veya geri yükleyin.
- **Cookie Manager:** JSON ve Netscape formatındaki çerezleri güvenle saklayın.

---

## 🏗️ Tech Stack

| Technology | Description |
| :--- | :--- |
| **React 18** | Frontend Library |
| **TypeScript** | Type Safety & Logic |
| **Tailwind CSS** | Styling Engine |
| **Web Crypto API** | Native Browser Encryption |
| **Google GenAI SDK** | AI Integration |
| **Lucide React** | Iconography |

---

## 📦 Installation

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Repository'yi Klonlayın**
    ```bash
    git clone https://github.com/ByGh00st/passvault.git
    cd passvault
    ```

2.  **Bağımlılıkları Yükleyin**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Uygulamayı Başlatın**
    ```bash
    npm start
    # veya
    yarn start
    ```

4.  **AI Özellikleri İçin (Opsiyonel)**
    Uygulama açıldığında `Settings` sekmesinden Google Gemini API anahtarınızı girerek yapay zeka özelliklerini aktif edebilirsiniz.

---

## 🛡️ Security Details

**PassVault**, verilerinizi korumak için çok katmanlı bir güvenlik yaklaşımı benimser:

1.  **Salt Generation:** Her kasa kurulumunda kriptografik olarak rastgele 16-byte `Salt` üretilir.
2.  **Key Stretching:** Master parolanız PBKDF2 (SHA-256) ile `Salt` kullanılarak türetilir. Bu, Brute-Force saldırılarını imkansız hale getirir.
3.  **Encryption:** Veriler AES-GCM modunda şifrelenir. Bu mod hem gizlilik hem de veri bütünlüğü (integrity) sağlar.
4.  **Local Execution:** Tüm şifreleme ve şifre çözme işlemleri tarayıcınızın belleğinde gerçekleşir.

> **Uyarı:** Master şifrenizi unutursanız verilerinizi kurtarmanın **HİÇBİR YOLU YOKTUR**. Güvenliğiniz için arka kapı (backdoor) bırakılmamıştır.

---

## 👤 Developer

**By Ghost**

- 🌐 Website: [byghost.tr](https://byghost.tr/)
- 🐱 GitHub: [@ByGh00st](https://github.com/ByGh00st)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Designed & Developed by <strong>By Ghost</strong> with ❤️</sub>
</div>
