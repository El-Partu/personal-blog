const catchAsync = async fn =>{
    return (req, res) =>{
        fn(req, res).catch(err)
    }
}

export default catchAsync