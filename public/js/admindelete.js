const deleteProduct=(btn)=>{
    const productElement = btn.closest('article');
    const prodId=productElement.querySelector('[name="prodID"]').value;
    const csrf=productElement.querySelector('[name="_csrf"]').value;
    fetch('/admin/admin-products/'+prodId,{
        method:"DELETE",
        headers:{'csrf-token':csrf}
    }).then(result=>result.json())
    .then(data=>{
        console.log(data)
        productElement.remove()
    })
    .catch(err=>console.log(err));
}