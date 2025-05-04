# Code Citations

## License: unknown
https://github.com/gabrieldeavila/gt_design/tree/3844565a210c63ee70cb87b2b4f858574bd67e38/src/hooks/helpers/useIsMobile.js

```
=> {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }
```

