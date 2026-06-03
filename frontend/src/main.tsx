import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#00d2ff',
            colorBgContainer: '#16213e',
            colorBgElevated: '#1a1a2e',
            colorBgLayout: '#0f0f23',
            colorBorder: '#2a2a4a',
            colorText: '#e0e0e0',
            colorTextSecondary: '#8892b0',
            borderRadius: 8,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Layout: {
              siderBg: '#0f0f23',
              headerBg: '#16213e',
              bodyBg: '#0f0f23',
            },
            Menu: {
              darkItemBg: '#0f0f23',
              darkSubMenuItemBg: '#0a0a1a',
              darkItemSelectedBg: '#1a3a5c',
            },
            Card: {
              colorBgContainer: '#16213e',
            },
            Table: {
              colorBgContainer: '#16213e',
              headerBg: '#1a1a2e',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
