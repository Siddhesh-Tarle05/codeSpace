import * as z from "zod"
import { tool } from "langchain"
import axios from "axios";

export const listfiles = tool(
  async({},config) => {
  const writer = config.context?.writer ?? (() => {});
    writer("listing files in project directory")
   const response= await axios.get(`http://sandbox-service-${config.context.projectId}:3000/list-files`)
   console.log('response from list files tool')
     writer("files listed successfully")
   return response.data
  },
  {
    name: "list_files",
    description: "this is used to list the files in the directory",
    schema: z.object({}),
  }
);
export const updatefiles=tool(
    async({updates},config)=>{
    const writer = config.context?.writer ?? (() => {});
    writer("updating files in project directory")
      console.log('update files tool used')
        const response=await axios.patch(`http://sandbox-service-${config.context.projectId}:3000/update-files`,
          {updates}
        )
         console.log('response from update files tool',response)
         writer("updated files in project directory")
          return response.data
    },
    {
      name:"update_files",
      description:"use this tool to update the code in the files",
      schema:z.object({
        updates:z.array(
          z.object({
            file:z.string(),
            content:z.string()
          })
        )
      })
    }
)
export const readfiles=tool(
  async({files},config)=>{
    const writer = config.context?.writer ?? (() => {});
    writer("reading files in project directory")
    console.log('read files tooluse')
    const response=await axios.get(`http://sandbox-service-${config.context.projectId}:3000/read-files?files=${files.join(',')}`)
     console.log('response from read files tool')
      write("files successfully read")
      return response.data
  },{
    name:'read_files',
    description:"use this tool to read the code in the files",
    schema:z.object({
      files:z.array(z.string())
    })
  }
)

export const createfiles=tool(
  async({files},config)=>{
    console.log('create  files ')
    const response=await axios.post(`http://sandbox-service-${config.context.projectId}:3000/create-files`,{files})
         console.log('response from create files tool')
          return response.data
  },{
    name:'create_files',
    description:'use this tool to create new files',
    schema:z.object({
      files:z.array(
        z.object({
          file:z.string(),
          content:z.string()
        })
      )
    })
  }
)