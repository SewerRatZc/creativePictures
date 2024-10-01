<script setup>
import { ref } from 'vue'

const originalImage = ref(null)
const referenceImage = ref(null)
const originalImageUrl = ref('')
const referenceImageUrl = ref('')
const photoUrl = ref('')

// 处理文件上传，传递图片类型保存到对应变量
const handleFileUpload = (event, type) => {
  const file = event.target.files[0]
  if (type === 'original') {
    originalImage.value = file
  } else if (type === 'reference') {
    referenceImage.value = file
  }
}

// 上传文件到 OSS 并获取 URL
const uploadToOss = async (file) => {
  try {
    const filePath = file.path // 获取本地文件路径
    const result = await window.api.uploadFile(filePath)
    return result // 返回 OSS URL
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}

// 上传并获取原图的 URL
const uploadOriginalImage = async () => {
  if (!originalImage.value) {
    alert('请先选择人像原图')
    return
  }
  originalImageUrl.value = await uploadToOss(originalImage.value)
  console.log(`=========${originalImageUrl.value}`)
}

// 上传并获取参考图的 URL
const uploadReferenceImage = async () => {
  if (!referenceImage.value) {
    alert('请先选择卡通参考图')
    return
  }
  referenceImageUrl.value = await uploadToOss(referenceImage.value)
}

// 生成 Cosplay 写真
const generateCosplayPhoto = async () => {
  try {
    if (!originalImageUrl.value || !referenceImageUrl.value) {
      alert('请先上传图片并生成 URL')
      return
    }

    // 调用后端生成 Cosplay API，API 需要指定模型类型和输入参数
    const result = await window.api.generateCosplayPhoto({
      model: 'wanx-style-cosplay-v1', // 模型类型
      input: {
        model_index: 1, // 设置风格
        face_image_url: originalImageUrl.value, // 人像图片的 URL
        template_image_url: referenceImageUrl.value // 动漫参考图的 URL
      }
    })

    photoUrl.value = result.photoUrl // 设置生成的写真 URL
  } catch (error) {
    console.error('生成 Cosplay 写真时发生错误:', error)
  }
}
</script>

<template>
  <div class="container">
    <h1>Cosplay Anime Photo Generator</h1>
    <div>
      <input type="file" @change="handleFileUpload($event, 'original')" />
      <label>上传人像原图</label>
      <button @click="uploadOriginalImage">上传原图</button>
      <div v-if="originalImageUrl">
        原图 URL: <a :href="originalImageUrl" target="_blank">{{ originalImageUrl }}</a>
      </div>
    </div>
    <div>
      <input type="file" @change="handleFileUpload($event, 'reference')" />
      <label>上传卡通动漫参考图</label>
      <button @click="uploadReferenceImage">上传参考图</button>
      <div v-if="referenceImageUrl">
        参考图 URL: <a :href="referenceImageUrl" target="_blank">{{ referenceImageUrl }}</a>
      </div>
    </div>

    <button @click="generateCosplayPhoto">生成Cosplay写真</button>

    <div v-if="photoUrl">
      <h2>生成的写真</h2>
      <img :src="photoUrl" alt="Cosplay Photo" />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

input {
  margin: 10px 0;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
}

img {
  margin-top: 20px;
  max-width: 100%;
  height: auto;
}
</style>
