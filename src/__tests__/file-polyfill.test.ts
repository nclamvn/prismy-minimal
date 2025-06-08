describe('File polyfill test', () => {
  it('should have File constructor', () => {
    expect(typeof File).toBe('function');
  });

  it('should create File with arrayBuffer method', async () => {
    const file = new File(['Hello World'], 'test.txt');
    expect(file).toBeDefined();
    expect(file.name).toBe('test.txt');
    expect(typeof file.arrayBuffer).toBe('function');
    
    const buffer = await file.arrayBuffer();
    expect(buffer).toBeDefined();
  });
});