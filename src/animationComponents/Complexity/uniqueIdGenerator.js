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
      return this.currentId;
    }
  }
  
  const uniqueIdGenerator = new UniqueIdGenerator();
  
  export default uniqueIdGenerator;
  