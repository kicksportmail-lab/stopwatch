import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/main.tsx");import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

import __vite__cjsImport1_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=666a8bd6"; const _jsxDEV = __vite__cjsImport1_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport2_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=666a8bd6"; const createRoot = __vite__cjsImport2_reactDom_client["createRoot"];
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=666a8bd6"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react;
import App from "/src/App.tsx";
import "/src/index.css?t=1766223249593";
// Force unregister all service workers to clear potential stale caches
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations)=>{
        for (const registration of registrations){
            console.log('Unregistering SW:', registration);
            registration.unregister();
        }
    });
}
class ErrorBoundary extends React.Component {
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return /*#__PURE__*/ _jsxDEV("div", {
                style: {
                    padding: '20px',
                    color: 'red',
                    fontFamily: 'monospace'
                },
                children: [
                    /*#__PURE__*/ _jsxDEV("h1", {
                        children: "Something went wrong."
                    }, void 0, false, {
                        fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
                        lineNumber: 34,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ _jsxDEV("pre", {
                        children: this.state.error?.toString()
                    }, void 0, false, {
                        fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
                        lineNumber: 35,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ _jsxDEV("pre", {
                        children: this.state.error?.stack
                    }, void 0, false, {
                        fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
                        lineNumber: 36,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
                lineNumber: 33,
                columnNumber: 17
            }, this);
        }
        return this.props.children;
    }
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
}
const rootElement = document.getElementById("root");
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(/*#__PURE__*/ _jsxDEV(ErrorBoundary, {
        children: /*#__PURE__*/ _jsxDEV(App, {}, void 0, false, {
            fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
            lineNumber: 51,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "C:/Users/C/swift-chronicle/src/main.tsx",
        lineNumber: 50,
        columnNumber: 9
    }, this));
} else {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Root element not found!</div>';
}


if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/C/swift-chronicle/src/main.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/C/swift-chronicle/src/main.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVJvb3QgfSBmcm9tIFwicmVhY3QtZG9tL2NsaWVudFwiO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCBBcHAgZnJvbSBcIi4vQXBwLnRzeFwiO1xyXG5pbXBvcnQgXCIuL2luZGV4LmNzc1wiO1xyXG5cclxuLy8gRm9yY2UgdW5yZWdpc3RlciBhbGwgc2VydmljZSB3b3JrZXJzIHRvIGNsZWFyIHBvdGVudGlhbCBzdGFsZSBjYWNoZXNcclxuaWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmdldFJlZ2lzdHJhdGlvbnMoKS50aGVuKHJlZ2lzdHJhdGlvbnMgPT4ge1xyXG4gICAgICAgIGZvciAoY29uc3QgcmVnaXN0cmF0aW9uIG9mIHJlZ2lzdHJhdGlvbnMpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1VucmVnaXN0ZXJpbmcgU1c6JywgcmVnaXN0cmF0aW9uKTtcclxuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLnVucmVnaXN0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuY2xhc3MgRXJyb3JCb3VuZGFyeSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDx7IGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGUgfSwgeyBoYXNFcnJvcjogYm9vbGVhbiwgZXJyb3I6IEVycm9yIHwgbnVsbCB9PiB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wczogeyBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlIH0pIHtcclxuICAgICAgICBzdXBlcihwcm9wcyk7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHsgaGFzRXJyb3I6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXREZXJpdmVkU3RhdGVGcm9tRXJyb3IoZXJyb3I6IEVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgaGFzRXJyb3I6IHRydWUsIGVycm9yIH07XHJcbiAgICB9XHJcblxyXG4gICAgY29tcG9uZW50RGlkQ2F0Y2goZXJyb3I6IEVycm9yLCBlcnJvckluZm86IFJlYWN0LkVycm9ySW5mbykge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBlcnJvcjpcIiwgZXJyb3IsIGVycm9ySW5mbyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmhhc0Vycm9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcyMHB4JywgY29sb3I6ICdyZWQnLCBmb250RmFtaWx5OiAnbW9ub3NwYWNlJyB9fT5cclxuICAgICAgICAgICAgICAgICAgICA8aDE+U29tZXRoaW5nIHdlbnQgd3JvbmcuPC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8cHJlPnt0aGlzLnN0YXRlLmVycm9yPy50b1N0cmluZygpfTwvcHJlPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwcmU+e3RoaXMuc3RhdGUuZXJyb3I/LnN0YWNrfTwvcHJlPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5jaGlsZHJlbjtcclxuICAgIH1cclxufVxyXG5cclxuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJvb3RcIik7XHJcblxyXG5pZiAocm9vdEVsZW1lbnQpIHtcclxuICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KHJvb3RFbGVtZW50KTtcclxuICAgIHJvb3QucmVuZGVyKFxyXG4gICAgICAgIDxFcnJvckJvdW5kYXJ5PlxyXG4gICAgICAgICAgICA8QXBwIC8+XHJcbiAgICAgICAgPC9FcnJvckJvdW5kYXJ5PlxyXG4gICAgKTtcclxufSBlbHNlIHtcclxuICAgIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9XCJjb2xvcjogcmVkOyBwYWRkaW5nOiAyMHB4O1wiPlJvb3QgZWxlbWVudCBub3QgZm91bmQhPC9kaXY+JztcclxufVxyXG4iXSwibmFtZXMiOlsiY3JlYXRlUm9vdCIsIlJlYWN0IiwiQXBwIiwibmF2aWdhdG9yIiwic2VydmljZVdvcmtlciIsImdldFJlZ2lzdHJhdGlvbnMiLCJ0aGVuIiwicmVnaXN0cmF0aW9ucyIsInJlZ2lzdHJhdGlvbiIsImNvbnNvbGUiLCJsb2ciLCJ1bnJlZ2lzdGVyIiwiRXJyb3JCb3VuZGFyeSIsIkNvbXBvbmVudCIsImdldERlcml2ZWRTdGF0ZUZyb21FcnJvciIsImVycm9yIiwiaGFzRXJyb3IiLCJjb21wb25lbnREaWRDYXRjaCIsImVycm9ySW5mbyIsInJlbmRlciIsInN0YXRlIiwiZGl2Iiwic3R5bGUiLCJwYWRkaW5nIiwiY29sb3IiLCJmb250RmFtaWx5IiwiaDEiLCJwcmUiLCJ0b1N0cmluZyIsInN0YWNrIiwicHJvcHMiLCJjaGlsZHJlbiIsInJvb3RFbGVtZW50IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInJvb3QiLCJib2R5IiwiaW5uZXJIVE1MIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsU0FBU0EsVUFBVSxRQUFRLG1CQUFtQjtBQUM5QyxPQUFPQyxXQUFXLFFBQVE7QUFDMUIsT0FBT0MsU0FBUyxZQUFZO0FBQzVCLE9BQU8sY0FBYztBQUVyQix1RUFBdUU7QUFDdkUsSUFBSSxtQkFBbUJDLFdBQVc7SUFDOUJBLFVBQVVDLGFBQWEsQ0FBQ0MsZ0JBQWdCLEdBQUdDLElBQUksQ0FBQ0MsQ0FBQUE7UUFDNUMsS0FBSyxNQUFNQyxnQkFBZ0JELGNBQWU7WUFDdENFLFFBQVFDLEdBQUcsQ0FBQyxxQkFBcUJGO1lBQ2pDQSxhQUFhRyxVQUFVO1FBQzNCO0lBQ0o7QUFDSjtBQUVBLE1BQU1DLHNCQUFzQlgsTUFBTVksU0FBUztJQU12QyxPQUFPQyx5QkFBeUJDLEtBQVksRUFBRTtRQUMxQyxPQUFPO1lBQUVDLFVBQVU7WUFBTUQ7UUFBTTtJQUNuQztJQUVBRSxrQkFBa0JGLEtBQVksRUFBRUcsU0FBMEIsRUFBRTtRQUN4RFQsUUFBUU0sS0FBSyxDQUFDLG1CQUFtQkEsT0FBT0c7SUFDNUM7SUFFQUMsU0FBUztRQUNMLElBQUksSUFBSSxDQUFDQyxLQUFLLENBQUNKLFFBQVEsRUFBRTtZQUNyQixxQkFDSSxRQUFDSztnQkFBSUMsT0FBTztvQkFBRUMsU0FBUztvQkFBUUMsT0FBTztvQkFBT0MsWUFBWTtnQkFBWTs7a0NBQ2pFLFFBQUNDO2tDQUFHOzs7Ozs7a0NBQ0osUUFBQ0M7a0NBQUssSUFBSSxDQUFDUCxLQUFLLENBQUNMLEtBQUssRUFBRWE7Ozs7OztrQ0FDeEIsUUFBQ0Q7a0NBQUssSUFBSSxDQUFDUCxLQUFLLENBQUNMLEtBQUssRUFBRWM7Ozs7Ozs7Ozs7OztRQUdwQztRQUVBLE9BQU8sSUFBSSxDQUFDQyxLQUFLLENBQUNDLFFBQVE7SUFDOUI7SUF6QkEsWUFBWUQsS0FBb0MsQ0FBRTtRQUM5QyxLQUFLLENBQUNBO1FBQ04sSUFBSSxDQUFDVixLQUFLLEdBQUc7WUFBRUosVUFBVTtZQUFPRCxPQUFPO1FBQUs7SUFDaEQ7QUF1Qko7QUFFQSxNQUFNaUIsY0FBY0MsU0FBU0MsY0FBYyxDQUFDO0FBRTVDLElBQUlGLGFBQWE7SUFDYixNQUFNRyxPQUFPbkMsV0FBV2dDO0lBQ3hCRyxLQUFLaEIsTUFBTSxlQUNQLFFBQUNQO2tCQUNHLGNBQUEsUUFBQ1Y7Ozs7Ozs7Ozs7QUFHYixPQUFPO0lBQ0grQixTQUFTRyxJQUFJLENBQUNDLFNBQVMsR0FBRztBQUM5QiJ9