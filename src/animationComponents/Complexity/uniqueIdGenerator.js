class UniqueIdGenerator {
    constructor() {
      if (!UniqueIdGenerator.instance) {
        this.currentId = 0;
        UniqueIdGenerator.instance = this;
      }
  
      return UniqueIdGenerator.instance;
    }
  
    getNextId() {
      this.currentId += 1;
      // Do not want to assume id is always a valid number
      return String(this.currentId);
    }
  }
  
  const uniqueIdGenerator = new UniqueIdGenerator();
  
  export default uniqueIdGenerator;
  