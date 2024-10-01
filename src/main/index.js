import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import axios from 'axios'
import OSS from 'ali-oss'
import path from 'path'
require('dotenv').config()

// import fs from 'fs' // Node.js file system module

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET_NAME
})

const API_KEY = process.env.API_KEY

// 上传文件到 OSS
async function uploadToOss(filePath) {
  try {
    const fileName = path.basename(filePath) // 获取文件名
    const result = await client.put(fileName, filePath) // 上传文件到 OSS
    console.log('File uploaded successfully:', result.url) // 打印上传成功的文件 URL
    return result.url // 返回生成的 URL
  } catch (err) {
    console.error('Error uploading file:', err)
    throw err
  }
}

// 处理文件上传 IPC 请求
ipcMain.handle('upload-file', async (event, filePath) => {
  try {
    const url = await uploadToOss(filePath)
    return url // 返回 OSS URL
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('generate-cosplay-photo', async (event, faceImageUrl, templateImageUrl) => {
  try {
    // 发送生成任务的请求
    const taskCreationResponse = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
      {
        model: 'wanx-style-cosplay-v1', // 模型名称
        input: {
          model_index: 1, // 生成风格：1 代表 3D卡通
          face_image_url: faceImageUrl, // 前端传递过来的原图URL
          template_image_url: templateImageUrl // 前端传递的模板图URL
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`, // 使用你自己的API Key
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable' // 开启异步处理
        }
      }
    )

    const taskId = taskCreationResponse.data.output.task_id // 获取任务ID
    let taskStatus = 'PENDING'
    let resultUrl = null

    // 轮询任务状态，直到任务完成或失败
    while (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
      const taskStatusResponse = await axios.get(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}` // 使用你自己的API Key
          }
        }
      )

      taskStatus = taskStatusResponse.data.output.task_status
      if (taskStatus === 'SUCCEEDED') {
        resultUrl = taskStatusResponse.data.output.result_url // 任务成功后返回结果URL
      } else if (taskStatus === 'FAILED') {
        throw new Error('任务失败')
      }

      // 每隔几秒检查一次任务状态
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    return { photoUrl: resultUrl } // 返回生成的图片URL
  } catch (error) {
    console.error('生成Cosplay照片时发生错误:', error)
    throw error
  }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
