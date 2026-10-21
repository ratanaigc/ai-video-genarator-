# Wan 2.1 AI Video Generator (Free ZeroGPU Hugging Face)

កម្មវិធីបង្កើតវីដេអូចលនា **Image-to-Video** និង **Text-to-Video** ដោយឥតគិតថ្លៃ 100% ដោយប្រើតែ **HTML, CSS និង JavaScript** (Pure Client-side Web App) តភ្ជាប់ដោយផ្ទាល់ទៅកាន់ម៉ាស៊ីន **Wan 2.1 (14B)** នៅលើ **Hugging Face ZeroGPU**។

---

## 🌟 លក្ខណៈពិសេសចម្បង (Key Features)

1. **ម៉ាស៊ីន Wan 2.1 ZeroGPU ឥតគិតថ្លៃ (100% Free):**
   - ប្រើម៉ូដែល **Wan 2.1 14B + CausVid LoRA** (Space: `multimodalart/wan2-1-fast`) ដែលដំណើរការលើ ZeroGPU (NVIDIA GPU ឥតគិតថ្លៃរបស់ Hugging Face)។
   - បង្កើតវីដេអូចលនាកម្រិតខ្ពស់ត្រឹមតែ **4-8 ជំហាន (Steps)** ចំណាយពេលត្រឹមតែប្រមាណ 15 ទៅ 30 វិនាទីប៉ុណ្ណោះ។

2. **2 របៀបដំណើរការ (Two Modes):**
   - **Image to Video (I2V):** បញ្ចូលរូបភាព (Upload, Drag & Drop, ឬ `Ctrl+V` Paste) + សរសេរ Motion Prompt -> បង្កើតជាវីដេអូចលនា។
   - **Text to Video (T2V):** គ្រាន់តែវាយ Prompt ប្រព័ន្ធនឹងបង្កើតរូបភាពដើមដ៏ស្រស់ស្អាតដោយស្វ័យប្រវត្តិតាមរយៈ FLUX / AI រួចបញ្ជូនទៅ Wan 2.1 ដើម្បីបង្កើតជាវីដេអូ។

3. **ការគ្រប់គ្រងកម្រិតច្បាស់ & សមាមាត្រ (Aspect Ratio):**
   - **16:9 Landscape (896 × 512)** - ល្អបំផុតសម្រាប់ YouTube / កុំព្យូទ័រ
   - **9:16 Portrait (512 × 896)** - ល្អបំផុតសម្រាប់ TikTok, Facebook Reels, YouTube Shorts
   - **1:1 Square (640 × 640)** - សម្រាប់ Instagram
   - គណនាទំហំភីកសែលត្រូវនឹងពហុគុណនៃ 32 ដោយស្វ័យប្រវត្តិ (តាមតម្រូវការបច្ចេកទេសរបស់ Wan 2.1)។

4. **មុខងារសម្រួលការងារ:**
   - គំរូរូបភាព និងគំរូ Motion Prompt ស្រាប់ៗ (Pan, Water Flow, Wind/Hair, Zoom in, Facial Expression...)
   - Negative Prompt ការពារបញ្ហារូបភាពខូច ទម្រង់មិនស្អាត
   - ឧបករណ៍ចាក់វីដេអូកម្រិតខ្ពស់ + ប៊ូតុងទាញយកឯកសារ `.mp4`
   - រក្សាទុកប្រវត្តិវីដេអូ (Video History Gallery) ដោយស្វ័យប្រវត្តិក្នុង Local Storage
   - គាំទ្រ Hugging Face Access Token (ជម្រើសបន្ថែម) ដើម្បីកាត់បន្ថយពេលវេលារង់ចាំក្នុង Queue។

---

## 🚀 របៀបដំណើរការកម្មវិធី (How to Run)

### វិធីទី ១: ចុចដំណើរការតាមរយៈ `start.bat` (ងាយស្រួលបំផុត)
គ្រាន់តែចុចទ្វេដង (Double click) លើឯកសារ:
```
start.bat
```
ប្រព័ន្ធនឹងបើក Local Server និងបើក Browser បង្ហាញកម្មវិធីដោយស្វ័យប្រវត្តិនៅ `http://localhost:8000`។

### វិធីទី ២: ដំណើរការតាម Terminal / PowerShell
```powershell
# ប្រើ Python
python -m http.server 8000

# ឬប្រើ Node.js npx
npx serve -p 8000
```
បន្ទាប់មកបើក Browser ទៅកាន់: [http://localhost:8000](http://localhost:8000)

### វិធីទី ៣: បើក `index.html` ផ្ទាល់
អ្នកក៏អាចចុចបើក `index.html` ដោយផ្ទាល់នៅលើ Browser (Chrome, Edge, Firefox, Safari)។

---

## 📝 គំរូ Prompt ល្អៗសម្រាប់ Wan 2.1 (Best Motion Prompts)

| ចលនាដែលចង់បាន | គំរូ Prompt (ភាសាអង់គ្លេសផ្ដល់លទ្ធផលល្អបំផុត) |
|---|---|
| **បង្វិលកាមេរ៉ាភាពយន្ត** | `cinematic slow camera pan, sweeping view, smooth motion, highly detailed, dramatic lighting` |
| **ខ្យល់បក់សក់ និងសម្លៀកបំពាក់** | `gentle breeze blowing, soft hair flowing, clothes fluttering naturally in the wind, realistic physics` |
| **ទេសភាពទឹកហូរ** | `dynamic water flowing, waves crashing softly, sparkling splashes in sunlight, hyper realistic` |
| **មនុស្សញញឹម និងកម្រើកភ្នែក** | `character smiling gently, subtle blinking, soft eye movement, natural face animation` |
| **ពន្លឺវេទមន្ត** | `glowing magical particles floating in the air, soft mystical light aura, ethereal ambience` |
| **Zoom យឺតៗ** | `slow motion cinematic zoom in, shallow depth of field, 4k cinematic atmosphere` |

---

## ⚙️ ការកំណត់ម៉ាស៊ីន (Settings & Hugging Face Token)

- កម្មវិធីប្រើ Space លំនាំដើម: `multimodalart/wan2-1-fast` (ដំណើរការលើ Hugging Face ZeroGPU Free)។
- ប្រសិនបើអ្នកមាន Hugging Face Access Token ឥតគិតថ្លៃ (ទម្រង់ `hf_...`):
  1. ចុចលើរូប **Settings (⚙️)** នៅជ្រុងខាងស្តាំខាងលើ
  2. បញ្ចូល Token របស់អ្នកទៅក្នុងប្រអប់ **Hugging Face Token**
  3. ចុច **រក្សាទុកការកំណត់**
  *(Token នឹងជួយឱ្យអ្នកទទួលបានអាទិភាពក្នុង Queue និងបង្កើន Quota ការប្រើប្រាស់លើ ZeroGPU)*។

---

## 📂 រចនាសម្ព័ន្ធឯកសារ (Project Structure)
```
d:\ការងារ\genarate video\
├── index.html     # ទំព័រដើម និងទម្រង់ UI
├── style.css      # ការតុបតែង UI បែប Dark Mode & Glassmorphism
├── app.js         # កូដ JavaScript តភ្ជាប់ជាមួយ Wan 2.1 Gradio API
├── start.bat      # ឯកសារសម្រាប់ចុចបើកកម្មវិធី 1-click
└── README.md      # សៀវភៅណែនាំ
```
